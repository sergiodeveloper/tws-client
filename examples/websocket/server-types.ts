export type TwsSchema = {
  operations: {
    /**
     * Create a product
     *
     * Create a product and notify the client through WebSocket
     */
    createProduct: {
      type: 'operation',
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
  };
  clientEvents: {
    /**
     * Authenticate
     *
     * Authenticate the client connection
     */
    authenticate: {
      type: 'clientEvent',
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
  serverEvents: {
    /**
     * Product created
     *
     * Notify that a product was created
     */
    productCreated: {
      type: 'serverEvent',
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
    };
  };
};
