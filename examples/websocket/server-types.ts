export type TwsSchema = {
  operations: {
    /**
     * Create a product
     *
     * Create a product and notify the client through WebSocket
     */
    createProduct: {
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
    };

    /**
     * Authenticate
     *
     * Authenticate the client connection
     */
    authenticate: {
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
    };
  };
  events: {
    /**
     * Product created
     *
     * Notify that a product was created
     */
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
    };
  };
};
