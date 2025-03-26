import {
  Operation, Schema, HTTPServerHelper, RemoteControl, WebSocketServerHelper, type ServerSocket,
} from '@tws-js/server';

const wsConnections: {
  [connectionId: string]: ServerSocket,
} = {};

const remoteControl = new RemoteControl({
  events: {
    productCreated: {
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

const schema = new Schema({
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
  authenticate: new Operation({
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
}, {
  remoteControl,
  logger: {
    error: (message) => console.error(`[Server] ${message}`),
    info: (message) => console.info(`[Server] ${message}`),
  },
  enablePlayground: true,
});

async function createProduct(name: string, price: number) {
  // Here we would create the product in the database...

  // For testing purposes we will assume that the owner of the product is the only
  // client connected to the server. Let's notify them through WebSocket indicating
  // that the product was created

  await remoteControl.sendEvent('productCreated', {
    clientIds: Object.keys(wsConnections),
    data: {
      name,
      price,
    },
  });

  // Send the response to the client through HTTP
  return {
    feedback: `Product ${name} created with price ${price}`,
  };
}

HTTPServerHelper.create({
  port: 3000,
  schema,
  path: '/tws',
});

console.log('[Server] HTTP Server listening on port 3000');

const webSocketServer = WebSocketServerHelper.create({
  port: 3001,
  schema,
  onClientConnected: (clientId, connection) => {
    console.log('[Server] A new client connected');
    wsConnections[clientId] = connection;
  },
  onClientDisconnected: (clientId) => {
    console.log('[Server] A client disconnected');
    delete wsConnections[clientId];
  },
});

console.log('[Server] WebSocket Server listening: ', webSocketServer.url);
