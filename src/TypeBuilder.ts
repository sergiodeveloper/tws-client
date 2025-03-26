import * as fs from 'fs';

import { io as createClientSocket } from 'socket.io-client';
import * as JSON5 from 'json5';
import axios from 'axios';
import {
  ArrayTypeDefinition,
  EnumTypeDefinition,
  InputTypeDefinition,
  ObjectTypeDefinition,
  OutputTypeDefinition,
  PrimitiveTypeDefinition,
} from '@tws-js/common';

import type { ImportedOperation, ImportedSchema, ImportedServerEvent } from './TwsClient';

const MAX_JSDOC_LINE_WIDTH = 80;

const EMPTY_OBJECT_TS = 'Record<string, never>';

export class TypeBuilder {
  static breakString(inputString: string, lineWidth: number): string[] {
    const words = inputString.split(' ');

    const lines: string[] = [];

    let currentLine = '';

    words.forEach((word) => {
      if (currentLine.length + word.length > lineWidth) {
        lines.push(currentLine.trim());
        currentLine = '';
      }

      currentLine += word + ' ';
    });

    if (currentLine.length > 0) {
      lines.push(currentLine.trim());
    }

    return lines;
  }

  static typeScriptString(text: string): string {
    return JSON5.stringify(text);
  }

  static createJsDocDescription(options: { title: string; description?: string }): string {
    let string = '';

    const multilineTitle = TypeBuilder.breakString(options.title, MAX_JSDOC_LINE_WIDTH);
    const multilineDescription =
      options.description && TypeBuilder.breakString(options.description, MAX_JSDOC_LINE_WIDTH);

    string += multilineTitle.map((line) => ` * ${line}`.trimEnd()).join('\n') + '\n';

    if (multilineDescription) {
      if (multilineTitle) {
        string += ' *\n';
      }
      string += multilineDescription.map((line) => ` * ${line}`.trimEnd()).join('\n') + '\n';
    }

    return `/**\n${string} */\n`;
  }

  static convertObjectTypeToTypeScript(value: ObjectTypeDefinition): string {
    let string = '{\n';

    string += `  type: '${value.type}';\n`;

    string +=
      typeof value.title === 'undefined'
        ? ''
        : `  title: ${TypeBuilder.typeScriptString(value.title)};\n`;

    string +=
      typeof value.description === 'undefined'
        ? ''
        : `  description: ${TypeBuilder.typeScriptString(value.description)};\n`;

    string += typeof value.required === 'undefined' ? '' : `  required: ${value.required};\n`;

    if (Object.entries(value.properties).length > 0) {
      string += `  properties: {\n`;

      Object.entries(value.properties).forEach(([key, value]) => {
        string += `    ${key}: ${TypeBuilder.convertTypeDefinitionToTypeScript(value).replace(
          /\n/g,
          '\n    ',
        )};\n`;
      });

      string += '  };\n';
    } else {
      string += `  properties: ${EMPTY_OBJECT_TS};\n`;
    }

    string += '}';

    return string;
  }

  static convertArrayTypeToTypeScript(value: ArrayTypeDefinition): string {
    let string = '{\n';

    string += `  type: '${value.type}';\n`;

    string +=
      typeof value.title === 'undefined'
        ? ''
        : `  title: ${TypeBuilder.typeScriptString(value.title)};\n`;

    string +=
      typeof value.description === 'undefined'
        ? ''
        : `  description: ${TypeBuilder.typeScriptString(value.description)};\n`;

    string += `  item: ${TypeBuilder.convertTypeDefinitionToTypeScript(value.item).replace(
      /\n/g,
      '\n  ',
    )};\n`;

    string += '}';

    return string;
  }

  static convertEnumTypeValuesToTypeScript(input: EnumTypeDefinition['values']): string {
    let string = '{\n';

    Object.entries(input).forEach(([key, value]) => {
      string += `  ${key}: `;

      if (typeof value.title === 'undefined' && typeof value.description === 'undefined') {
        string += EMPTY_OBJECT_TS + ';\n';
      } else {
        string += '{\n';

        if (typeof value.title !== 'undefined') {
          string += `    title: ${TypeBuilder.typeScriptString(value.title)};\n`;
        }

        if (typeof value.description !== 'undefined') {
          string += `    description: ${TypeBuilder.typeScriptString(value.description)};\n`;
        }

        string += '  };\n';
      }
    });

    string += '}';

    return string;
  }

  static convertEnumTypeToTypeScript(input: EnumTypeDefinition): string {
    let string = '{\n';

    string += `  type: '${input.type}';\n`;

    string +=
      typeof input.title === 'undefined'
        ? ''
        : `  title: ${TypeBuilder.typeScriptString(input.title)};\n`;

    string +=
      typeof input.description === 'undefined'
        ? ''
        : `  description: ${TypeBuilder.typeScriptString(input.description)};\n`;

    string += typeof input.required === 'undefined' ? '' : `  required: ${input.required};\n`;

    string +=
      typeof input.defaultValue === 'undefined'
        ? ''
        : `  defaultValue: ${TypeBuilder.typeScriptString(input.defaultValue)};\n`;

    if (Object.entries(input.values).length > 0) {
      string += `  values: ${TypeBuilder.convertEnumTypeValuesToTypeScript(input.values).replace(
        /\n/g,
        '\n  ',
      )};\n`;
    } else {
      string += `  values: ${EMPTY_OBJECT_TS};\n`;
    }

    string += '}';

    return string;
  }

  static convertPrimitiveTypeToTypeScript(input: PrimitiveTypeDefinition): string {
    let string = '{\n';

    string += `  type: '${input.type}';\n`;

    string +=
      typeof input.title === 'undefined'
        ? ''
        : `  title: ${TypeBuilder.typeScriptString(input.title)};\n`;

    string +=
      typeof input.description === 'undefined'
        ? ''
        : `  description: ${TypeBuilder.typeScriptString(input.description)};\n`;

    string += typeof input.required === 'undefined' ? '' : `  required: ${input.required};\n`;

    string +=
      typeof input.defaultValue === 'undefined'
        ? ''
        : `  defaultValue: ${
            typeof input.defaultValue === 'string'
              ? TypeBuilder.typeScriptString(input.defaultValue)
              : JSON5.stringify(input.defaultValue)
          };\n`;

    string += '}';

    return string;
  }

  static convertTypeDefinitionToTypeScript(
    value:
      | PrimitiveTypeDefinition
      | ObjectTypeDefinition
      | ArrayTypeDefinition
      | EnumTypeDefinition,
  ): string {
    if (value.type === 'object') {
      return TypeBuilder.convertObjectTypeToTypeScript(value);
    } else if (value.type === 'array') {
      return TypeBuilder.convertArrayTypeToTypeScript(value);
    } else if (value.type === 'enum') {
      return TypeBuilder.convertEnumTypeToTypeScript(value);
    } else {
      return TypeBuilder.convertPrimitiveTypeToTypeScript(value);
    }
  }

  static convertInputToTypeScript(input: InputTypeDefinition): string {
    let string = '{\n';

    Object.entries(input).forEach(([key, value]) => {
      string += `  ${key}: ${TypeBuilder.convertTypeDefinitionToTypeScript(value).replace(
        /\n/g,
        '\n  ',
      )};\n`;
    });

    string += '}';

    return string;
  }

  static convertOutputToTypeScript(output: OutputTypeDefinition): string {
    if (output.type === 'object') {
      return TypeBuilder.convertObjectTypeToTypeScript(output);
    } else if (output.type === 'array') {
      return TypeBuilder.convertArrayTypeToTypeScript(output);
    } else if (output.type === 'enum') {
      return TypeBuilder.convertEnumTypeToTypeScript(output);
    } else {
      return TypeBuilder.convertPrimitiveTypeToTypeScript(output);
    }
  }

  static convertOperationToTypeScript(options: {
    name: string;
    operation: ImportedOperation;
  }): string {
    let string = '';

    string += TypeBuilder.createJsDocDescription({
      title: options.operation.title || options.name,
      description: options.operation.description,
    });

    const stringInput =
      Object.entries(options.operation.input).length > 0
        ? TypeBuilder.convertInputToTypeScript(options.operation.input).replace(/\n/g, '\n  ')
        : EMPTY_OBJECT_TS;

    const stringOutput =
      Object.entries(options.operation.output).length > 0
        ? TypeBuilder.convertOutputToTypeScript(options.operation.output).replace(/\n/g, '\n  ')
        : EMPTY_OBJECT_TS;

    string += `${options.name}: {\n`;
    string += options.operation.title
      ? `  title: ${TypeBuilder.typeScriptString(options.operation.title)};\n`
      : '';
    string += options.operation.description
      ? `  description: ${TypeBuilder.typeScriptString(options.operation.description)};\n`
      : '';
    string += `  input: ${stringInput};\n`;
    string += `  output: ${stringOutput};\n`;
    string += '};';

    return string;
  }

  static convertEventToTypeScript(options: { name: string; event: ImportedServerEvent }): string {
    let string = '';

    string += TypeBuilder.createJsDocDescription({
      title: options.event.title || options.name,
      description: options.event.description,
    });

    const stringInput =
      Object.entries(options.event.input).length > 0
        ? TypeBuilder.convertInputToTypeScript(options.event.input).replace(/\n/g, '\n  ')
        : EMPTY_OBJECT_TS;

    string += `${options.name}: {\n`;
    string += options.event.title
      ? `  title: ${TypeBuilder.typeScriptString(options.event.title)};\n`
      : '';
    string += options.event.description
      ? `  description: ${TypeBuilder.typeScriptString(options.event.description)};\n`
      : '';
    string += `  input: ${stringInput};\n`;
    string += '};';

    return string;
  }

  static convertSchemaToTypeScript(schema: ImportedSchema): string {
    let string = 'export type TwsSchema = {\n';

    if (Object.entries(schema.operations).length === 0) {
      string += `  operations: ${EMPTY_OBJECT_TS};\n`;
    } else {
      string += '  operations: {\n';
      string += Object.entries(schema.operations)
        .map(
          ([operationName, operation]) =>
            TypeBuilder.convertOperationToTypeScript({
              name: operationName,
              operation,
            })
              .split('\n')
              .map((line) => `    ${line}`.trimEnd())
              .join('\n') + '\n',
        )
        .join('\n');
      string += '  };\n';
    }

    if (Object.entries(schema.events).length === 0) {
      string += `  events: ${EMPTY_OBJECT_TS};\n`;
    } else {
      string += '  events: {\n';
      string += Object.entries(schema.events)
        .map(
          ([eventName, event]) =>
            TypeBuilder.convertEventToTypeScript({
              name: eventName,
              event,
            })
              .split('\n')
              .map((line) => `    ${line}`.trimEnd())
              .join('\n') + '\n',
        )
        .join('\n');
      string += '  };\n';
    }

    string += '};\n';

    return string;
  }

  static getServerAndOutputFromCli(argv: string[]): {
    serverUrl: string;
    outputFile: string;
  } {
    const args = argv.slice(2).join(' ');

    const serverUrl =
      args.match(/--server(=|\s+)([^\s]+)/)?.[2] || args.match(/-s(=|\s+)([^\s]+)/)?.[2];

    const outputFile =
      args.match(/--output(=|\s+)([^\s]+)/)?.[2] || args.match(/-o(=|\s+)([^\s]+)/)?.[2];

    if (!serverUrl) {
      throw new Error('Missing server url. Please provide a server url with --server= parameter');
    }

    if (!outputFile) {
      throw new Error(
        'Missing output filename. Please provide an output filename with --output= parameter',
      );
    }

    return {
      serverUrl,
      outputFile,
    };
  }

  private static async getSchemaFromHTTPServer(options: {
    serverUrl: string;
    httpAgent?: unknown;
    httpsAgent?: unknown;
  }) {
    try {
      return (
        await axios.request({
          url: options.serverUrl,
          method: 'GET',
          responseType: 'text',
          httpAgent: options.httpAgent,
          httpsAgent: options.httpsAgent,
        })
      ).data;
    } catch (error) {
      throw new Error(`Failed to fetch schema from server: ${error}`);
    }
  }

  private static async getSchemaFromWebSocketServer(options: {
    serverUrl: string;
    httpAgent?: unknown;
    httpsAgent?: unknown;
  }) {
    const clientWebSocketConnection = createClientSocket(options.serverUrl, {
      agent: options.httpAgent as never,
    });

    await new Promise((resolve) => clientWebSocketConnection.on('connect', () => resolve(0)));

    clientWebSocketConnection.emit('message', JSON.stringify({ resource: 'schema' }));

    return new Promise<string>((resolve, reject) => {
      clientWebSocketConnection.on('error', (error) => {
        reject(error);
      });

      clientWebSocketConnection.on('message', (message) => {
        const parsedMessage = JSON.parse(
          Buffer.isBuffer(message) ? message.toString('utf8') : message,
        );

        resolve(parsedMessage.data);
      });

      clientWebSocketConnection.on('error', (error) => {
        reject(error);
      });
    });
  }

  /**
   * Fetches and parses the schema from the server, connecting via http, https or websocket.
   *
   * You can specify the HTTP or HTTPS agent to use for the request, for example, in case the
   * server is behind a proxy. For HTTP requests, you can use the `http` or `https` module,
   * for example, `require('https').Agent`. For WebSocket requests, you can use the package
   * https://www.npmjs.com/package/https-proxy-agent
   */
  static async getSchemaFromServer(options: {
    serverUrl: string;
    httpAgent?: unknown;
    httpsAgent?: unknown;
  }): Promise<ImportedSchema> {
    let response: string;

    if (options.serverUrl.startsWith('ws')) {
      response = await TypeBuilder.getSchemaFromWebSocketServer(options);
    } else {
      response = await TypeBuilder.getSchemaFromHTTPServer(options);
    }

    try {
      return JSON.parse(response);
    } catch (error) {
      throw new Error(`Failed to parse schema: ${error}`);
    }
  }

  static async main(argv: string[]) {
    const options = TypeBuilder.getServerAndOutputFromCli(argv);

    const schema = await TypeBuilder.getSchemaFromServer({
      serverUrl: options.serverUrl,
    });

    const stringifiedData = TypeBuilder.convertSchemaToTypeScript(schema);

    fs.writeFileSync(options.outputFile, stringifiedData);
  }
}
