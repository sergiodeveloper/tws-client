import { mkdirSync, readFileSync } from 'fs';

import { Operation, Schema } from '@tws-js/server';

import { TwsClient, TypeBuilder } from '../../src';

import { ServerProvider } from './utils';

const servers = new ServerProvider();

const TWS_SCHEMA_PATH = '/tws/schema';
const MY_OPERATION = 'My operation';

describe('client fetches schema', () => {
  afterEach(async () => {
    jest.restoreAllMocks();
    await servers.stop();
  });

  beforeEach(async () => {
    mkdirSync(__dirname + '/types', { recursive: true });
  });

  test('client fetches schema with missing server url', async () => {
    await expect(
      TypeBuilder.main(['', '', '--output=' + __dirname + '/types/schemaWithMissingServerUrl.ts']),
    ).rejects.toThrow('Missing server url. Please provide a server url with --server= parameter');
  });

  test('client fetches schema with missing output filename', async () => {
    await expect(TypeBuilder.main(['', '', '--server=http://localhost:2222'])).rejects.toThrow(
      'Missing output filename. Please provide an output filename with --output= parameter',
    );
  });

  test('client fetches schema with wrong server url', async () => {
    const schema = new Schema({});

    const server = await servers.createTwsHttpServer({ schema });

    await expect(
      TypeBuilder.main([
        '',
        '',
        '--server=' + server.url + '/tws',
        '--output=' + __dirname + '/types/schemaWithWrongServerUrl.ts',
      ]),
    ).rejects.toThrow('Failed to parse schema: ');
  });

  test('client fetches schema with an unreachable server', async () => {
    await expect(
      TypeBuilder.main([
        '',
        '',
        '--server=http://localhost:2222',
        '--output=' + __dirname + '/types/schemaWithUnreachableServer.ts',
      ]),
    ).rejects.toThrow('Failed to fetch schema from server: ConnectionRefused');
  });

  test('client fetches schema with all types of inputs', async () => {
    // Server

    const schema = new Schema({
      myOperation: new Operation({
        title: MY_OPERATION,
        description: MY_OPERATION,
        input: {
          myPrimitive: {
            type: 'string',
            required: true,
            title: 'My primitive',
            description: 'My primitive',
          },
          myArray: {
            type: 'array',
            required: true,
            title: 'My array',
            description: 'My array',
            item: {
              type: 'int',
              required: true,
              title: 'My array item',
              description: 'My array item',
            },
          },
          myObject: {
            type: 'object',
            required: true,
            title: 'My object',
            description: 'My object',
            properties: {
              myProperty: {
                type: 'string',
                required: true,
                title: 'My property',
                description: 'My property',
              },
            },
          },
          emptyObject: {
            type: 'object',
            required: true,
            title: 'Empty object',
            description: 'Provide an empty object',
            properties: {},
          },
          myEnum: {
            type: 'enum',
            required: true,
            title: 'My enum',
            description: 'My enum',
            values: {
              A: {
                title: 'Letter A',
                description: 'Description A',
              },
              B: {},
              C: {
                title: 'Letter C',
                description: 'Description C',
              },
            },
          },
        },
        output: {
          type: 'string',
        },
        handler: jest.fn().mockResolvedValue('ok'),
      }),
    });

    const server = await servers.createTwsHttpServer({
      schema,
    });

    // Client

    await TypeBuilder.main([
      '',
      '',
      '--server=' + server.url + TWS_SCHEMA_PATH,
      '--output=' + __dirname + '/types/schemaWithAllInputTypes.ts',
    ]);

    const twsClient = new TwsClient<import('./types/schemaWithAllInputTypes').TwsSchema>({
      url: server.url + '/tws',
    });

    const result1 = await twsClient.execute('myOperation', {
      myPrimitive: 'ok',
      myArray: [1, 2, 3],
      myObject: {
        myProperty: 'ok',
      },
      emptyObject: {},
      myEnum: 'A',
    });
    expect(result1).toBe('ok');
  });

  test('client fetches schema with an operation without title or description', async () => {
    // Server

    const schema = new Schema({
      undocumentedOperation: new Operation({
        input: {
          myPrimitive: {
            type: 'string',
          },
        },
        output: {
          type: 'string',
        },
        handler: jest.fn().mockResolvedValue('ok'),
      }),
    });

    const server = await servers.createTwsHttpServer({ schema });

    // Cliente

    await TypeBuilder.main([
      '',
      '',
      '--server=' + server.url + TWS_SCHEMA_PATH,
      '--output=' + __dirname + '/types/schemaWithUndocumentedOperation.ts',
    ]);

    const fileContent = readFileSync(
      __dirname + '/types/schemaWithUndocumentedOperation.ts',
      'utf-8',
    );

    expect(fileContent).toContain(`
  operations: {
    /**
     * undocumentedOperation
     */
    undocumentedOperation: {`);
  });

  test('client fetches schema with an enum without values', async () => {
    // Server

    const schema = new Schema({
      myOperation: new Operation({
        title: MY_OPERATION,
        description: MY_OPERATION,
        input: {
          myEnum: {
            type: 'enum',
            values: {},
          },
        },
        output: {
          type: 'string',
        },
        handler: jest.fn().mockResolvedValue('ok'),
      }),
    });

    const server = await servers.createTwsHttpServer({ schema });

    // Client

    await TypeBuilder.main([
      '',
      '',
      '--server=' + server.url + TWS_SCHEMA_PATH,
      '--output=' + __dirname + '/types/schemaWithEnumWithoutValues.ts',
    ]);

    const fileContent = readFileSync(__dirname + '/types/schemaWithEnumWithoutValues.ts', 'utf-8');

    expect(fileContent).toContain(`
        myEnum: {
          type: 'enum';
          values: Record<string, never>;
        };`);
  });

  test('client fetches schema with a primitive type with default value', async () => {
    // Server

    const schema = new Schema({
      myOperation: new Operation({
        input: {
          myPrimitive: {
            type: 'string',
            defaultValue: 'ok',
          },
        },
        output: {
          type: 'string',
        },
        handler: jest.fn().mockResolvedValue('ok'),
      }),
    });

    const server = await servers.createTwsHttpServer({ schema });

    // Client

    await TypeBuilder.main([
      '',
      '',
      '--server=' + server.url + TWS_SCHEMA_PATH,
      '--output=' + __dirname + '/types/schemaWithPrimitiveTypeWithDefaultValue.ts',
    ]);

    const fileContent = readFileSync(
      __dirname + '/types/schemaWithPrimitiveTypeWithDefaultValue.ts',
      'utf-8',
    );

    expect(fileContent).toContain(`
        myPrimitive: {
          type: 'string';
          defaultValue: 'ok';
        };`);
  });

  test('client fetches schema with object, array and enum outputs', async () => {
    // Server

    const schema = new Schema({
      outputObject: new Operation({
        input: {},
        output: {
          type: 'object',
          properties: {
            a: {
              type: 'string',
            },
          },
        },
        handler: jest.fn().mockResolvedValue({ a: 'a' }),
      }),
      outputArray: new Operation({
        input: {},
        output: {
          type: 'array',
          item: {
            type: 'string',
          },
        },
        handler: jest.fn().mockResolvedValue(['a']),
      }),
      outputEnum: new Operation({
        input: {},
        output: {
          type: 'enum',
          values: {
            A: {},
            B: {},
          },
        },
        handler: jest.fn().mockResolvedValue('A'),
      }),
      outputPrimitive: new Operation({
        input: {},
        output: {
          type: 'string',
        },
        handler: jest.fn().mockResolvedValue('a'),
      }),
    });

    const server = await servers.createTwsHttpServer({ schema });

    // Client

    await TypeBuilder.main([
      '',
      '',
      '--server=' + server.url + TWS_SCHEMA_PATH,
      '--output=' + __dirname + '/types/schemaWithOutputTypes.ts',
    ]);

    const fileContent = readFileSync(__dirname + '/types/schemaWithOutputTypes.ts', 'utf-8');

    expect(fileContent).toContain(`
    /**
     * outputObject
     */
    outputObject: {
      input: Record<string, never>;
      output: {
        type: 'object';
        properties: {
          a: {
            type: 'string';
          };
        };
      };
    };`);
    expect(fileContent).toContain(`
    /**
     * outputArray
     */
    outputArray: {
      input: Record<string, never>;
      output: {
        type: 'array';
        item: {
          type: 'string';
        };
      };
    };`);
    expect(fileContent).toContain(`
    /**
     * outputEnum
     */
    outputEnum: {
      input: Record<string, never>;
      output: {
        type: 'enum';
        values: {
          A: Record<string, never>;
          B: Record<string, never>;
        };
      };
    };`);
    expect(fileContent).toContain(`
    /**
     * outputPrimitive
     */
    outputPrimitive: {
      input: Record<string, never>;
      output: {
        type: 'string';
      };
    };`);
  });

  test('client fetches schema via WebSocket', async () => {
    // Server

    const schema = new Schema({
      myWebSocketSchema: new Operation({
        input: {},
        output: {
          type: 'string',
        },
        handler: jest.fn().mockResolvedValue('ok'),
      }),
    });

    const server = await servers.createTwsWebSocketServer({
      schema,
      onClientConnected: jest.fn(),
      onClientDisconnected: jest.fn(),
    });

    // Client

    await TypeBuilder.main([
      '',
      '',
      '--server=' + server.url,
      '--output=' + __dirname + '/types/schemaViaWebSocket.ts',
    ]);

    const fileContent = readFileSync(__dirname + '/types/schemaViaWebSocket.ts', 'utf-8');

    expect(fileContent).toContain(`
    /**
     * myWebSocketSchema
     */
    myWebSocketSchema: {
      input: Record<string, never>;
      output: {
        type: 'string';
      };
    };`);
  });

  test('client fetches schema via WebSocket with invalid server url', async () => {
    await expect(
      TypeBuilder.main([
        '',
        '',
        '--server=ws://localhost:2222',
        '--output=' + __dirname + '/types/schemaViaWebSocket.ts',
      ]),
    ).rejects.toThrow('Server is unreachable');
  });
});
