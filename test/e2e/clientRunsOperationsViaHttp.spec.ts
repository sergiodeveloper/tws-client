import { mkdirSync } from 'fs';

import { Operation, Schema } from '@tws-js/server';

import { TwsClient, TypeBuilder } from '../../src';

import { ServerProvider } from './utils';

const servers = new ServerProvider();

describe('client runs operations via HTTP', () => {
  afterEach(() => {
    jest.restoreAllMocks();
  });

  beforeEach(async () => {
    mkdirSync(__dirname + '/types', { recursive: true });
  });

  test('client runs an operation via HTTP', async () => {
    // Server

    const schema = new Schema({
      createComment: new Operation({
        title: 'Create comment',
        description:
          'Creates a comment. A long description to test the' +
          ' wrapping functionality. It should wrap the text to the next line.',
        input: {
          text: {
            type: 'string',
            required: true,
            title: 'Comment text',
            description: 'The text of the comment',
          },
        },
        output: {
          type: 'object',
          properties: {
            id: {
              type: 'string',
              description: 'The ID of the comment',
            },
          },
        },
        handler: jest.fn().mockResolvedValue({ id: 'comment-123' }),
      }),
    });

    const server = await servers.createTwsHttpServer({ schema });

    const headers = { test: 'ok' };
    const logger = { error: jest.fn() };

    // Client

    await TypeBuilder.main([
      '',
      '',
      '--server=' + server.url + '/tws/schema',
      '--output=' + __dirname + '/types/operationViaHttp.ts',
    ]);

    const twsClient = new TwsClient<import('./types/operationViaHttp').TwsSchema>({
      url: server.url + '/tws',
      headers,
      logger,
    });

    // Execute operation from client

    const result = await twsClient.execute('createComment', {
      text: 'This is a comment',
    });

    expect(result).toEqual({ id: 'comment-123' });

    expect(schema.operations.createComment.handler).toHaveBeenCalledTimes(1);
    expect(schema.operations.createComment.handler).toHaveBeenCalledWith(
      { text: 'This is a comment' },
      { headers: expect.objectContaining({ test: 'ok' }) },
    );
  });
});
