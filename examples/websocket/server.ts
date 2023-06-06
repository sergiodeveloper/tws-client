import * as WebSocket from 'ws';

import {
  ClientEvent, ServerEvent, Operation, Schema, createServer, RealtimeManager,
} from '@tws-js/server';

const wsConnections: {
  [connectionId: string]: WebSocket,
} = {};

const schema = new Schema({
  operations: {
    createProduct: new Operation({
      title: 'Create a product',
      description: 'Create a product and notify the client through WebSocket',
      input: {
        name: {
          type: 'string',
          required: true,
          title: 'Product name',
          description: 'The name of the product',
        },
        price: {
          type: 'float',
          title: 'Product price',
          description: 'The price of the product',
        },
      },
      output: {
        type: 'object',
        properties: {
          feedback: {
            type: 'string',
            description: 'The feedback message',
          },
        },
      },
      handler: ({ name, price }) => {
        console.log('[Server] Client invoked HTTP operation "createProduct"');
        return createProduct(name, price);
      },
    }),
  },

  clientEvents: {
    authenticate: new ClientEvent({
      title: 'Authenticate',
      description: 'Authenticate the client connection',
      input: {
        token: {
          type: 'string',
          title: 'Token',
          description: 'The token from the client',
        },
      },
      output: {
        type: 'object',
        properties: {
          code: {
            type: 'int',
            description: 'The response code',
          },
          message: {
            type: 'string',
            description: 'The response message',
          },
        },
      },
      handler: ({ token }) => {
        console.log(`[Server] Token received: ${token}`);

        return {
          code: 200,
          message: 'Token is valid!',
        };
      },
    }),
  },

  serverEvents: {
    productCreated: new ServerEvent({
      title: 'Product created',
      description: 'Notify that a product was created',
      input: {
        name: {
          type: 'string',
          title: 'Product name',
          description: 'The name of the product',
        },
        price: {
          type: 'float',
          title: 'Product price',
          description: 'The price of the product',
        },
      },
      output: {
        type: 'object',
        properties: {
          message: {
            type: 'string',
            description: 'Response expected from the client',
          },
        },
      },
    }),
  },
});

const realtimeManager = new RealtimeManager({
  schema,
  logger: {
    error: (message) => console.error(`[Server] ${message}`),
    info: (message) => console.info(`[Server] ${message}`),
  },
  clientEventSender: ({ connectionIds, payload }) => {
    connectionIds.forEach((connectionId) => {
      const connection = wsConnections[connectionId];
      if (connection && connection.readyState === WebSocket.OPEN) {
        connection.send(payload);
      }
    });
  },
});


async function createProduct(name: string, price: number) {
  // Here we would create the product in the database...

  // For testing purposes we will assume that the owner of the product is the only
  // client connected to the server. Let's notify them through WebSocket indicating
  // that the product was created

  const response = await realtimeManager.publish(Object.keys(wsConnections), 'productCreated', {
    name,
    price,
  });

  // Response is automatically typed
  console.log(`[Server] Received from client through websocket: response.message="${response.message}"`);

  // Send the response to the client through HTTP
  return {
    feedback: `Product ${name} created with price ${price}`,
  };
}

const server = createServer({
  schema,
  path: '/tws',
  logger: {
    error: (message) => console.error(message),
  },
  enablePlayground: true,
});

server.listen(3000);
console.log('[Server] HTTP Server listening on port 3000');

const wss = new WebSocket.Server({ port: 3001 });
console.log('[Server] WebSocket Server listening on port 3001');

wss.on('connection', (connection) => {
  console.log('[Server] A new client connected');

  const connectionId = `connection-${Math.floor(Math.random() * 1e10)}`;
  wsConnections[connectionId] = connection;

  connection.on('message', (message) => realtimeManager.processEventFromClient({
    connectionId,
    payload: `${message}`,
  }));

  connection.on('close', () => {
    console.log('[Server] A client disconnected');
    delete wsConnections[connectionId];
  });
});
