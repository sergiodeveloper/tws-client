import { TwsClient } from '@tws-js/client';

import type { TwsSchema } from './server-types';

const client = new TwsClient<TwsSchema>({
  url: 'http://localhost:3000/tws',
});

async function main() {
  // "execute" is automatically typed, so the linter will fail when an invalid operation is passed
  const data = await client.execute('hello', {
    name: 'John',
  });

  // "data" is automatically typed
  console.log(data);

  const sum = await client.execute('sum', {
    a: 1,
    b: 2,
  });

  console.log(`The sum is ${sum}`);

  const createProductResult = await client.execute('createProduct', {
    name: 'Telescope',
    price: 100,
    brand: 'Celestron',
    category: 'Optics',
    description: 'A telescope',
    tags: ['telescope', 'optics'],
    labels: [{
      name: 'New',
      value: 'true',
    }],
    rating: 5,
    session: 'first',
    visible: true,
  });

  console.log(`Created product: ${createProductResult.message}`);
}

main();
