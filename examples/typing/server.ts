import { Operation, Schema, createServer } from '@tws-js/server';

const schema = new Schema({
  operations: {
    hello: new Operation({
      description: 'A simple hello world operation',
      input: {
        name: {
          type: 'string',
          required: true,
          description: 'The name to greet',
        },
      },
      output: {
        type: 'object',
        properties: {
          message: {
            type: 'string',
            description: 'The greeting message',
          },
        },
      },
      handler: ({ name }, metadata) => { // "name" automatically typed as string
        return {
          // Typescript will warn if "message" is not a string,
          // as required by the output
          message: `Hello ${name}`,
        };
      },
    }),
    sum: new Operation({
      description: 'A simple sum operation',
      input: {
        a: {
          type: 'float',
          description: 'The first number',
        },
        b: {
          type: 'float',
          description: 'The second number',
        },
      },
      output: {
        type: 'float',
        description: 'The sum of the two numbers',
      },
      handler: ({ a, b }) => a + b,
    }),
    createProduct: new Operation({
      title: 'Make an order',
      description:
        'Create a product. The purpose of this operation is to demonstrate ' +
        'different types of input and output parameters',
      input: {
        name: {
          type: 'string',
          required: true,
          title: 'Product name',
          description: 'The name of the product',
          defaultValue: 'Laptop',
        },
        description: {
          type: 'string',
          required: false,
          title: 'Product description',
          description: 'The description of the product',
          defaultValue: 'A laptop',
        },
        brand: {
          type: 'string',
          required: true,
          title: 'Product brand',
          description: 'The brand of the product',
        },
        category: {
          type: 'string',
          required: false,
          title: 'Product category',
          description: 'The category of the product',
        },
        session: {
          type: 'enum',
          required: true,
          title: 'Product session',
          description: 'The session of the product',
          defaultValue: 'second',
          values: {
            first: {
              title: 'First session',
              description: 'The first session',
            },
            second: {
              title: 'Second session',
              description: 'The second session',
            },
            third: {
              title: 'Third session',
              description: 'The third session',
            },
          },
        },
        price: {
          type: 'float',
          title: 'Product price',
          description: 'The price of the product',
        },
        rating: {
          type: 'int',
          title: 'Product rating',
          description: 'The rating of the product',
        },
        visible: {
          type: 'boolean',
          title: 'Product visibility',
          description: 'The visibility of the product',
          defaultValue: true,
        },
        tags: {
          type: 'array',
          title: 'Product tags',
          description: 'The tags of the product',
          item: {
            type: 'string',
            title: 'Product tag',
            description: 'The tag of the product',
          },
        },
        labels: {
          type: 'array',
          title: 'Product labels',
          description: 'The labels of the product',
          item: {
            type: 'object',
            title: 'Product label',
            description: 'The label of the product',
            properties: {
              name: {
                type: 'string',
                title: 'Label name',
                description: 'The name of the label',
              },
              value: {
                type: 'string',
                title: 'Label value',
                description: 'The value of the label',
                required: false,
              },
            },
          },
        },
      },
      output: {
        type: 'object',
        properties: {
          message: {
            type: 'string',
            description: 'The message',
          },
        },
      },
      handler: ({ name, price, session }) => {
        return {
          message: `Product ${name}. The price is ${price}, session ${session}`,
        };
      },
    }),
  },
});

const server = createServer({
  schema,
  path: '/tws',
  logger: {
    error: (message) => console.error(message),
  },
  enablePlayground: true,
});

server.listen(3000);
console.log('Server listening on port 3000');
