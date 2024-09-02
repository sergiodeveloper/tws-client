import * as fs from 'fs';

import axios from 'axios';

import { TypeBuilder } from '../src/TypeBuilder';

describe('TypeBuilder', () => {
  afterEach(() => {
    jest.restoreAllMocks();
  });

  test('breakString', async () => {
    const string = 'String with many words that should be broken into multiple lines';

    const result = TypeBuilder.breakString(string, 20);

    expect(result).toEqual([
      'String with many',
      'words that should be',
      'broken into multiple',
      'lines',
    ]);
  });

  test('createJsDocDescription', async () => {
    jest.spyOn(TypeBuilder, 'breakString').mockImplementation((string) => [string]);

    const result = TypeBuilder.createJsDocDescription({
      title: 'Title',
      description: 'Description',
    });

    expect(result).toEqual(`/**
 * Title
 *
 * Description
 */
`);
  });

  test('createJsDocDescription with empty values', async () => {
    jest.spyOn(TypeBuilder, 'breakString').mockImplementation((string) => [string]);

    const result = TypeBuilder.createJsDocDescription({});
    expect(result).toEqual('');
  });

  test('convertOperationToTypeScript', async () => {
    jest.spyOn(TypeBuilder, 'createJsDocDescription').mockImplementation(() => 'jsdocdesc\n');

    const result = TypeBuilder.convertOperationToTypeScript({
      name: 'name',
      operation: {
        title: 'Title',
        description: 'Description',
        input: {
          a: { type: 'string' },
        },
        output: {
          type: 'string',
        },
      },
    });

    expect(result).toEqual(`jsdocdesc
name: {
  title: 'Title',
  description: 'Description',
  input: {
    a: {
      type: 'string',
    },
  },
  output: {
    type: 'string',
  },
};`);

    expect(TypeBuilder.createJsDocDescription).toHaveBeenCalledWith({
      title: 'Title',
      description: 'Description',
    });
  });

  test('convertOperationToTypeScript with no title and a description', async () => {
    jest.spyOn(TypeBuilder, 'createJsDocDescription').mockImplementation(() => 'jsdocdesc\n');

    const result = TypeBuilder.convertOperationToTypeScript({
      name: 'name',
      operation: {
        description: 'Description',
        input: {
          a: { type: 'string' },
        },
        output: {
          type: 'string',
        },
      },
    });

    expect(result).toEqual(`jsdocdesc
name: {
  description: 'Description',
  input: {
    a: {
      type: 'string',
    },
  },
  output: {
    type: 'string',
  },
};`);

    expect(TypeBuilder.createJsDocDescription).toHaveBeenCalledWith({
      title: 'name',
      description: 'Description',
    });
  });

  test('convertOperationToTypeScript with no title and no description', async () => {
    jest.spyOn(TypeBuilder, 'createJsDocDescription').mockImplementation(() => 'jsdocdesc\n');

    const result = TypeBuilder.convertOperationToTypeScript({
      name: 'name',
      operation: {
        input: {
          a: { type: 'string' },
        },
        output: {
          type: 'string',
        },
      },
    });

    expect(result).toEqual(`jsdocdesc
name: {
  input: {
    a: {
      type: 'string',
    },
  },
  output: {
    type: 'string',
  },
};`);

    expect(TypeBuilder.createJsDocDescription).toHaveBeenCalledWith({
      title: 'name',
      description: undefined,
    });
  });

  test('convertOperationToTypeScript with no input and no output', async () => {
    jest.spyOn(TypeBuilder, 'createJsDocDescription').mockImplementation(() => 'jsdocdesc\n');

    const result = TypeBuilder.convertOperationToTypeScript({
      name: 'name',
      operation: {
        title: 'Title',
        description: 'Description',
        input: {},
        // @ts-expect-error no output defined
        output: {},
      },
    });

    expect(result).toEqual(`jsdocdesc
name: {
  title: 'Title',
  description: 'Description',
  input: Record<string, never>,
  output: Record<string, never>,
};`);

    expect(TypeBuilder.createJsDocDescription).toHaveBeenCalledWith({
      title: 'Title',
      description: 'Description',
    });
  });

  test('convertSchemaToTypeScript', async () => {
    jest
      .spyOn(TypeBuilder, 'convertOperationToTypeScript')
      .mockImplementation(() => 'operationtsc');

    const result = TypeBuilder.convertSchemaToTypeScript({
      operations: {
        a: {
          title: 'Title',
          description: 'Description',
          input: {
            a: { type: 'string' },
          },
          output: {
            type: 'string',
          },
        },
        b: {
          title: 'Title',
          description: 'Description',
          input: {
            a: { type: 'string' },
          },
          output: {
            type: 'string',
          },
        },
      },
    });

    expect(result).toEqual(`export type TwsSchema = {
  operations: {
    operationtsc

    operationtsc
  };
};
`);
  });

  test('getServerAndOutputFromCli', async () => {
    const argv = ['node', 'tws', '--server', 'http://localhost:4321', '--output', 'output.ts'];

    const result = TypeBuilder.getServerAndOutputFromCli(argv);

    expect(result).toEqual({
      serverUrl: 'http://localhost:4321',
      outputFile: 'output.ts',
    });
  });

  test('getServerAndOutputFromCli with shorthand', async () => {
    const argv = ['node', 'tws', '-s', 'http://localhost:6805', '-o', 'output.ts'];

    const result = TypeBuilder.getServerAndOutputFromCli(argv);

    expect(result).toEqual({
      serverUrl: 'http://localhost:6805',
      outputFile: 'output.ts',
    });
  });

  test('getServerAndOutputFromCli with no server', async () => {
    const argv = ['node', 'tws', '--output', 'output.ts'];

    expect(() => TypeBuilder.getServerAndOutputFromCli(argv)).toThrowError('Missing server URL');
  });

  test('getServerAndOutputFromCli with no output file', async () => {
    const argv = ['node', 'tws', '--server', 'http://localhost:1234'];

    expect(() => TypeBuilder.getServerAndOutputFromCli(argv)).toThrowError(
      'Missing output filename',
    );
  });

  test('getSchemaFromServer', async () => {
    jest.spyOn(axios, 'request').mockResolvedValue({
      status: 200,
      data: JSON.stringify({ ok: 'test' }),
    });

    const result = await TypeBuilder.getSchemaFromServer({
      serverUrl: 'http://localhost:4222',
      httpAgent: 'testHttpAgent',
      httpsAgent: 'testHttpsAgent',
    });

    expect(result).toEqual({ ok: 'test' });

    expect(axios.request).toHaveBeenCalledWith({
      url: 'http://localhost:4222',
      method: 'GET',
      responseType: 'text',
      httpAgent: 'testHttpAgent',
      httpsAgent: 'testHttpsAgent',
    });
  });

  test('getSchemaFromServer with error on request', async () => {
    jest.spyOn(axios, 'request').mockRejectedValue(new Error('test'));

    await expect(
      TypeBuilder.getSchemaFromServer({
        serverUrl: 'http://localhost:5555',
      }),
    ).rejects.toThrowError('Failed to fetch schema from server: Error: test');
  });

  test('getSchemaFromServer with error on status code', async () => {
    jest.spyOn(axios, 'request').mockResolvedValue({
      status: 500,
      data: 'test',
    });

    await expect(
      TypeBuilder.getSchemaFromServer({
        serverUrl: 'http://localhost:4000',
      }),
    ).rejects.toThrowError('Server responded with status code 500: test');
  });

  test('getSchemaFromServer with error on invalid json', async () => {
    jest.spyOn(axios, 'request').mockResolvedValue({
      status: 200,
      data: 'test',
    });

    await expect(
      TypeBuilder.getSchemaFromServer({
        serverUrl: 'http://localhost:4000',
      }),
    ).rejects.toThrowError(
      'Failed to parse schema: SyntaxError: Unexpected token e in JSON at position 1',
    );
  });

  test('main', async () => {
    jest.spyOn(TypeBuilder, 'getServerAndOutputFromCli').mockReturnValue({
      serverUrl: 'myserverurl',
      outputFile: 'output.ts',
    });

    jest.spyOn(TypeBuilder, 'getSchemaFromServer').mockResolvedValue({
      operations: {
        a: {
          title: 'Title',
          description: 'Description',
          input: {
            a: { type: 'string' },
          },
          output: {
            type: 'string',
          },
        },
      },
    });

    jest.spyOn(TypeBuilder, 'convertSchemaToTypeScript').mockReturnValue('schematsc');

    jest.spyOn(fs, 'writeFileSync').mockImplementation();

    await TypeBuilder.main(['node', 'tws', '--server', 'myserverurl', '--output', 'output.ts']);

    expect(TypeBuilder.getSchemaFromServer).toHaveBeenCalledWith({ serverUrl: 'myserverurl' });

    expect(TypeBuilder.convertSchemaToTypeScript).toHaveBeenCalledWith({
      operations: {
        a: {
          title: 'Title',
          description: 'Description',
          input: {
            a: { type: 'string' },
          },
          output: {
            type: 'string',
          },
        },
      },
    });

    expect(fs.writeFileSync).toHaveBeenCalledWith('output.ts', 'schematsc');
  });
});
