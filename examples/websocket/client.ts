import { io as createClientSocket } from 'socket.io-client';

import { TwsClient } from '@tws-js/client';

import type { TwsSchema } from './server-types';

const client = new TwsClient<TwsSchema>({
  url: 'http://localhost:3000/tws',
  logger: {
    error: (message) => console.error(`[Client] ${message}`),
  },
});

const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

async function main() {
  const websocket = createClientSocket('ws://localhost:3001');

  websocket.on('message', (message: string | Buffer) => {
    client.processEvent(Buffer.isBuffer(message) ? message.toString('utf8') : message);
  });

  // Wait for the websocket to be connected
  await new Promise((resolve) => websocket.on('connect', () => resolve(0)));

  const response = await client.execute('authenticate', {
    token: '12345',
  });

  console.log(`[Client] Received response: ${JSON.stringify(response)}`);

  // Listen the websocket for new products being created
  client.on('productCreated', async (product) => {
    // "product" is automatically typed
    console.log(`[Client] Server created the product: product.name="${product.name}", product.price="${product.price}"`);
  });

  console.log('[Client] Waiting 2 seconds before creating a product...');
  await sleep(2000);

  const r = await client.execute('createProduct', {
    name: 'Product 1',
    price: 10,
  });

  console.log(`[Client] Received response: ${JSON.stringify(r)}`);
}

await main();
