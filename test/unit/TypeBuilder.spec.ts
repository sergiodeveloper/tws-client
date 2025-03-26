import * as fs from 'fs';

import axios from 'axios';

import { TypeBuilder } from '../../src/TypeBuilder';

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

  test('typeScriptString', async () => {
    const string = 'testString';

    const result = TypeBuilder.typeScriptString(string);

    expect(result).toEqual("'testString'");
  });

  test('createJsDocDescription successfully', async () => {
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

  test('createJsDocDescription with empty description', async () => {
    jest.spyOn(TypeBuilder, 'breakString').mockImplementation((string) => [string]);

    const result = TypeBuilder.createJsDocDescription({ title: 'Title' });
    expect(result).toEqual(`/**
 * Title
 */
`);
  });

  test('convertObjectTypeToTypeScript successfully', async () => {
    jest
      .spyOn(TypeBuilder, 'convertTypeDefinitionToTypeScript')
      .mockImplementation(() => 'typetsc');

    const result = TypeBuilder.convertObjectTypeToTypeScript({
      type: 'object',
      title: 'Title',
      description: 'Description',
      properties: {
        a: { type: 'string' },
      },
    });

    expect(result).toEqual(`{
  type: 'object';
  title: 'Title';
  description: 'Description';
  properties: {
    a: typetsc;
  };
}`);
  });

  test('convertObjectTypeToTypeScript with no title, description and properties', async () => {
    const result = TypeBuilder.convertObjectTypeToTypeScript({
      type: 'object',
      properties: {},
    });

    expect(result).toEqual(`{
  type: 'object';
  properties: Record<string, never>;
}`);
  });

  test('convertArrayTypeToTypeScript successfully', async () => {
    jest
      .spyOn(TypeBuilder, 'convertTypeDefinitionToTypeScript')
      .mockImplementation(() => 'typetsc');

    const result = TypeBuilder.convertArrayTypeToTypeScript({
      type: 'array',
      title: 'Title',
      description: 'Description',
      item: { type: 'string' },
    });

    expect(result).toEqual(`{
  type: 'array';
  title: 'Title';
  description: 'Description';
  item: typetsc;
}`);
  });

  test('convertArrayTypeToTypeScript with no title and description', async () => {
    jest
      .spyOn(TypeBuilder, 'convertTypeDefinitionToTypeScript')
      .mockImplementation(() => 'typetsc');

    const result = TypeBuilder.convertArrayTypeToTypeScript({
      type: 'array',
      item: { type: 'string' },
    });

    expect(result).toEqual(`{
  type: 'array';
  item: typetsc;
}`);
  });

  test('convertEnumTypeValuesToTypeScript successfully', async () => {
    const result = TypeBuilder.convertEnumTypeValuesToTypeScript({
      a: { title: 'Title', description: 'Description' },
      b: { title: 'Title', description: 'Description' },
    });

    expect(result).toEqual(`{
  a: {
    title: 'Title';
    description: 'Description';
  };
  b: {
    title: 'Title';
    description: 'Description';
  };
}`);
  });

  test('convertEnumTypeValuesToTypeScript with no title and description', async () => {
    const result = TypeBuilder.convertEnumTypeValuesToTypeScript({
      a: {},
      b: {},
    });

    expect(result).toEqual(`{
  a: Record<string, never>;
  b: Record<string, never>;
}`);
  });

  test('convertEnumTypeToTypeScript successfully', async () => {
    jest
      .spyOn(TypeBuilder, 'convertEnumTypeValuesToTypeScript')
      .mockImplementation(() => 'enumvaluetsc');

    const result = TypeBuilder.convertEnumTypeToTypeScript({
      type: 'enum',
      title: 'Title',
      description: 'Description',
      defaultValue: 'testDefaultValue',
      values: {
        a: { title: 'Title', description: 'Description' },
        b: { title: 'Title', description: 'Description' },
      },
    });

    expect(result).toEqual(`{
  type: 'enum';
  title: 'Title';
  description: 'Description';
  defaultValue: 'testDefaultValue';
  values: enumvaluetsc;
}`);
  });

  test('convertEnumTypeToTypeScript with no title, description and values', async () => {
    const result = TypeBuilder.convertEnumTypeToTypeScript({
      type: 'enum',
      values: {},
    });

    expect(result).toEqual(`{
  type: 'enum';
  values: Record<string, never>;
}`);
  });

  test('convertPrimitiveTypeToTypeScript successfully', async () => {
    const result = TypeBuilder.convertPrimitiveTypeToTypeScript({
      type: 'string',
      title: 'Title',
      description: 'Description',
      defaultValue: 'testDefaultValue',
      required: true,
    });

    expect(result).toEqual(`{
  type: 'string';
  title: 'Title';
  description: 'Description';
  required: true;
  defaultValue: 'testDefaultValue';
}`);
  });

  test('convertPrimitiveTypeToTypeScript with no title, description and defaultValue', async () => {
    const result = TypeBuilder.convertPrimitiveTypeToTypeScript({
      type: 'string',
    });

    expect(result).toEqual(`{
  type: 'string';
}`);
  });

  test('convertTypeDefinitionToTypeScript with object', async () => {
    jest.spyOn(TypeBuilder, 'convertObjectTypeToTypeScript').mockImplementation(() => 'objecttsc');

    const result = TypeBuilder.convertTypeDefinitionToTypeScript({
      type: 'object',
      title: 'Title',
      description: 'Description',
      properties: {
        a: { type: 'string' },
      },
    });

    expect(result).toEqual('objecttsc');
  });

  test('convertTypeDefinitionToTypeScript with array', async () => {
    jest.spyOn(TypeBuilder, 'convertArrayTypeToTypeScript').mockImplementation(() => 'arraytsc');

    const result = TypeBuilder.convertTypeDefinitionToTypeScript({
      type: 'array',
      title: 'Title',
      description: 'Description',
      item: { type: 'string' },
    });

    expect(result).toEqual('arraytsc');
  });

  test('convertTypeDefinitionToTypeScript with enum', async () => {
    jest.spyOn(TypeBuilder, 'convertEnumTypeToTypeScript').mockImplementation(() => 'enumtsc');

    const result = TypeBuilder.convertTypeDefinitionToTypeScript({
      type: 'enum',
      title: 'Title',
      description: 'Description',
      defaultValue: 'testDefaultValue',
      values: {
        a: { title: 'Title', description: 'Description' },
        b: { title: 'Title', description: 'Description' },
      },
    });

    expect(result).toEqual('enumtsc');
  });

  test('convertTypeDefinitionToTypeScript with primitive', async () => {
    jest
      .spyOn(TypeBuilder, 'convertPrimitiveTypeToTypeScript')
      .mockImplementation(() => 'primitivetsc');

    const result = TypeBuilder.convertTypeDefinitionToTypeScript({
      type: 'string',
      title: 'Title',
      description: 'Description',
      defaultValue: 'testDefaultValue',
      required: true,
    });

    expect(result).toEqual('primitivetsc');
  });

  test('convertInputToTypeScript successfully', async () => {
    jest
      .spyOn(TypeBuilder, 'convertTypeDefinitionToTypeScript')
      .mockImplementation(() => 'typetsc');

    const result = TypeBuilder.convertInputToTypeScript({
      a: { type: 'string' },
      b: { type: 'array', item: { type: 'string' } },
    });

    expect(result).toEqual(`{
  a: typetsc;
  b: typetsc;
}`);
  });

  test('convertOutputToTypeScript with object', async () => {
    jest.spyOn(TypeBuilder, 'convertObjectTypeToTypeScript').mockImplementation(() => 'objecttsc');

    const result = TypeBuilder.convertOutputToTypeScript({
      type: 'object',
      title: 'Title',
      description: 'Description',
      properties: {
        a: { type: 'string' },
      },
    });

    expect(result).toEqual('objecttsc');
  });

  test('convertOutputToTypeScript with array', async () => {
    jest.spyOn(TypeBuilder, 'convertArrayTypeToTypeScript').mockImplementation(() => 'arraytsc');

    const result = TypeBuilder.convertOutputToTypeScript({
      type: 'array',
      title: 'Title',
      description: 'Description',
      item: { type: 'string' },
    });

    expect(result).toEqual('arraytsc');
  });

  test('convertOutputToTypeScript with enum', async () => {
    jest.spyOn(TypeBuilder, 'convertEnumTypeToTypeScript').mockImplementation(() => 'enumtsc');

    const result = TypeBuilder.convertOutputToTypeScript({
      type: 'enum',
      values: {
        a: { title: 'Title', description: 'Description' },
        b: { title: 'Title', description: 'Description' },
      },
    });

    expect(result).toEqual('enumtsc');
  });

  test('convertOutputToTypeScript with primitive', async () => {
    jest
      .spyOn(TypeBuilder, 'convertPrimitiveTypeToTypeScript')
      .mockImplementation(() => 'primitivetsc');

    const result = TypeBuilder.convertOutputToTypeScript({
      type: 'string',
      title: 'Title',
      description: 'Description',
    });

    expect(result).toEqual('primitivetsc');
  });

  test('convertOperationToTypeScript successfully', async () => {
    jest.spyOn(TypeBuilder, 'createJsDocDescription').mockImplementation(() => 'jsdocdesc\n');

    jest.spyOn(TypeBuilder, 'convertInputToTypeScript').mockImplementation(() => 'inputtsc');

    jest.spyOn(TypeBuilder, 'convertOutputToTypeScript').mockImplementation(() => 'outputtsc');

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
  title: 'Title';
  description: 'Description';
  input: inputtsc;
  output: outputtsc;
};`);

    expect(TypeBuilder.createJsDocDescription).toHaveBeenCalledWith({
      title: 'Title',
      description: 'Description',
    });
  });

  test('convertOperationToTypeScript with no title, description, input or output', async () => {
    jest.spyOn(TypeBuilder, 'createJsDocDescription').mockImplementation(() => 'jsdocdesc\n');

    const result = TypeBuilder.convertOperationToTypeScript({
      name: 'name',
      operation: {
        input: {},
        // @ts-expect-error no output defined
        output: {},
      },
    });

    expect(result).toEqual(`jsdocdesc
name: {
  input: Record<string, never>;
  output: Record<string, never>;
};`);
  });

  test('convertEventToTypeScript successfully', async () => {
    jest.spyOn(TypeBuilder, 'createJsDocDescription').mockImplementation(() => 'jsdocdesc\n');

    jest.spyOn(TypeBuilder, 'convertInputToTypeScript').mockImplementation(() => 'inputtsc');

    const result = TypeBuilder.convertEventToTypeScript({
      name: 'name',
      event: {
        title: 'Title',
        description: 'Description',
        input: {
          a: { type: 'string' },
        },
      },
    });

    expect(result).toEqual(`jsdocdesc
name: {
  title: 'Title';
  description: 'Description';
  input: inputtsc;
};`);

    expect(TypeBuilder.createJsDocDescription).toHaveBeenCalledWith({
      title: 'Title',
      description: 'Description',
    });
  });

  test('convertEventToTypeScript with no title, description or input', async () => {
    jest.spyOn(TypeBuilder, 'createJsDocDescription').mockImplementation(() => 'jsdocdesc\n');

    const result = TypeBuilder.convertEventToTypeScript({
      name: 'name',
      event: {
        input: {},
      },
    });

    expect(result).toEqual(`jsdocdesc
name: {
  input: Record<string, never>;
};`);
  });

  test('convertSchemaToTypeScript successfully', async () => {
    jest
      .spyOn(TypeBuilder, 'convertOperationToTypeScript')
      .mockImplementation(() => 'operationtsc');

    jest.spyOn(TypeBuilder, 'convertEventToTypeScript').mockImplementation(() => 'eventtsc');

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
      events: {
        d: {
          title: 'Title',
          description: 'Description',
          input: {
            f: { type: 'string' },
          },
        },
        e: {
          title: 'Title',
          description: 'Description',
          input: {
            f: { type: 'string' },
          },
        },
      },
    });

    expect(result).toEqual(`export type TwsSchema = {
  operations: {
    operationtsc

    operationtsc
  };
  events: {
    eventtsc

    eventtsc
  };
};
`);
  });

  test('convertSchemaToTypeScript with no operations or events', async () => {
    const result = TypeBuilder.convertSchemaToTypeScript({
      operations: {},
      events: {},
    });

    expect(result).toEqual(`export type TwsSchema = {
  operations: Record<string, never>;
  events: Record<string, never>;
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

    expect(() => TypeBuilder.getServerAndOutputFromCli(argv)).toThrow(
      'Missing server url. Please provide a server url with --server= parameter',
    );
  });

  test('getServerAndOutputFromCli with no output file', async () => {
    const argv = ['node', 'tws', '--server', 'http://localhost:1234'];

    expect(() => TypeBuilder.getServerAndOutputFromCli(argv)).toThrow(
      'Missing output filename. Please provide an output filename with --output= parameter',
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
    ).rejects.toThrow('Failed to fetch schema from server: Error: test');
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
    ).rejects.toThrow(
      'Failed to parse schema: SyntaxError: JSON Parse error: Unexpected identifier "test"',
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
      events: {},
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
      events: {},
    });

    expect(fs.writeFileSync).toHaveBeenCalledWith('output.ts', 'schematsc');
  });
});
