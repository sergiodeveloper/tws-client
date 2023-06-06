import * as WebSocket from 'ws';

import { TwsClient } from '@tws-js/client';

import type { TwsSchema } from './server-types';

const client = new TwsClient<TwsSchema>({
  url: 'http://localhost:3000/tws',
  logger: {
    error: (message) => console.error(`[Client] ${message}`),
    info: (message) => console.log(`[Client] ${message}`),
  },
});

const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

async function main() {
  const websocket = new WebSocket('ws://localhost:3001');
  websocket.onmessage = event => client.processEventFromServer(`${event.data}`);
  client.setServerEventSender((event) => websocket.send(event));

  // Wait for the websocket to be connected
  await new Promise((resolve) => websocket.onopen = resolve);

  const response = await client.send('authenticate', {
    token: '12345',
  });

  console.log(`[Client] Received from server through websocket: ${JSON.stringify(response)}`);

  // Listen the websocket for new products being created
  client.on('productCreated', async (product) => {
    // "product" is automatically typed
    console.log(`[Client] Server created the product: product.name="${product.name}", product.price="${product.price}"`);

    // Answer the server
    return {
      message: 'Client received the product successfully!',
    };
  });

  console.log('[Client] Waiting 5 seconds before creating a product...');
  await sleep(5000);

  client.execute('createProduct', {
    name: 'Product 1',
    price: 10,
  });
}

main();
