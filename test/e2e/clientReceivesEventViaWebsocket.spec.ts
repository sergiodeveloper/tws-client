import { mkdirSync } from 'fs';

import { io as newClientSocket } from 'socket.io-client';
import { RemoteControl, Schema, WebSocketServerHelper, type ServerSocket } from '@tws-js/server';

import { TwsClient, TypeBuilder } from '../../src';

import { getFreePort, ServerProvider, waitFor } from './utils';

describe('client receives event via WebSocket', () => {
  afterEach(() => {
    jest.restoreAllMocks();
  });

  beforeEach(async () => {
    mkdirSync(__dirname + '/types', { recursive: true });
  });

  test('client receives an event via WebSocket', async () => {
    // Server

    const wsConnections: Record<string, ServerSocket> = {};

    const remoteControl = new RemoteControl({
      events: {
        userJoined: {
          title: 'A user joined the chat',
          description: 'Notify that a user joined the chat',
          input: {
            name: {
              type: 'string',
              title: 'User name',
              description: 'The name of the user',
            },
          },
        },
      },
      eventSender: ({ clientIds, payload }) => {
        clientIds.forEach((clientId) => {
          const connection = wsConnections[clientId];
          if (connection) {
            connection.send(payload);
          }
        });
      },
    });

    const schema = new Schema({}, { remoteControl });

    const server = WebSocketServerHelper.create({
      port: await getFreePort(),
      schema,
      onClientConnected: (clientId, connection) => {
        wsConnections[clientId] = connection;
      },
      onClientDisconnected: (clientId) => {
        delete wsConnections[clientId];
      },
    });

    // Client

    await TypeBuilder.main([
      '',
      '',
      '--server=' + server.url,
      '--output=' + __dirname + '/types/clientReceivesEventViaWebSocket.ts',
    ]);

    const twsClient = new TwsClient<import('./types/clientReceivesEventViaWebSocket').TwsSchema>({
      url: '',
      headers: { test: 'ok' },
      httpAgent: ServerProvider.getHttpAgent(),
      httpsAgent: ServerProvider.getHttpsAgent(),
    });

    const clientUserJoinedListenerSpy = jest.fn();

    twsClient.on('userJoined', clientUserJoinedListenerSpy);

    const clientWebsocketConnection = newClientSocket(server.url);

    clientWebsocketConnection.on('message', (message: string | Buffer) => {
      twsClient.processEvent(Buffer.isBuffer(message) ? message.toString('utf8') : message);
    });

    await new Promise((resolve) => clientWebsocketConnection.on('connect', () => resolve(0)));

    // Send an event from the server to the client
    await remoteControl.sendEvent('userJoined', {
      clientIds: Object.keys(wsConnections),
      data: {
        name: 'John Doe',
      },
    });

    // Wait for the client to receive the event
    await waitFor(() => clientUserJoinedListenerSpy.mock.calls.length === 1);

    expect(clientUserJoinedListenerSpy).toHaveBeenCalledWith({
      name: 'John Doe',
    });
  });
});
