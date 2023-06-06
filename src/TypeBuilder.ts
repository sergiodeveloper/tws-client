import * as fs from 'fs';

import * as JSON5 from 'json5';
import axios, { AxiosResponse } from 'axios';

import type { ImportedOperation, ImportedSchema } from './TwsClient';

const MAX_JSDOC_LINE_WIDTH = 80;

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

  static createJsDocDescription(options: { title?: string; description?: string }): string {
    let string = '';

    const multilineTitle =
      options.title && TypeBuilder.breakString(options.title, MAX_JSDOC_LINE_WIDTH);
    const multilineDescription =
      options.description && TypeBuilder.breakString(options.description, MAX_JSDOC_LINE_WIDTH);

    if (multilineTitle) {
      string += multilineTitle.map((line) => ` * ${line}`.trimEnd()).join('\n') + '\n';
    }

    if (multilineDescription) {
      if (multilineTitle) {
        string += ' *\n';
      }
      string += multilineDescription.map((line) => ` * ${line}`.trimEnd()).join('\n') + '\n';
    }

    if (string.length > 0) {
      return `/**\n${string} */\n`;
    }
    return '';
  }

  static convertBaseOperationToTypeScript(options: {
    name: string;
    baseOperation: ImportedOperation;
  }): string {
    let string = '';

    string += TypeBuilder.createJsDocDescription({
      title: options.baseOperation.title || options.name,
      description: options.baseOperation.description,
    });

    string += `${options.name}: ${JSON5.stringify(options.baseOperation, null, 2)};`;

    return string;
  }

  static convertSchemaToTypeScript(schema: ImportedSchema): string {
    let string = 'export type TwsSchema = {\n';

    string += '  operations: {\n';
    string += Object.entries(schema.operations)
      .map(
        ([operationName, operation]) =>
          TypeBuilder.convertBaseOperationToTypeScript({
            name: operationName,
            baseOperation: operation,
          })
            .split('\n')
            .map((line) => `    ${line}`.trimEnd())
            .join('\n') + '\n',
      )
      .join('\n');
    string += '  };\n';

    string += '  clientEvents: {\n';
    string += Object.entries(schema.clientEvents)
      .map(
        ([operationName, operation]) =>
          TypeBuilder.convertBaseOperationToTypeScript({
            name: operationName,
            baseOperation: operation,
          })
            .split('\n')
            .map((line) => `    ${line}`.trimEnd())
            .join('\n') + '\n',
      )
      .join('\n');
    string += '  };\n';

    string += '  serverEvents: {\n';
    string += Object.entries(schema.serverEvents)
      .map(
        ([operationName, operation]) =>
          TypeBuilder.convertBaseOperationToTypeScript({
            name: operationName,
            baseOperation: operation,
          })
            .split('\n')
            .map((line) => `    ${line}`.trimEnd())
            .join('\n') + '\n',
      )
      .join('\n');
    string += '  };\n';

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
      throw new Error('Missing server URL');
    }

    if (!outputFile) {
      throw new Error('Missing output filename');
    }

    return {
      serverUrl,
      outputFile,
    };
  }

  static async getSchemaFromServer(serverUrl: string): Promise<ImportedSchema> {
    let response: AxiosResponse<string>;

    try {
      response = await axios.request({
        url: serverUrl,
        method: 'GET',
        responseType: 'text',
      });
    } catch (error) {
      throw new Error(`Failed to fetch schema from server: ${error}`);
    }

    if (response.status !== 200) {
      throw new Error(`Server responded with status code ${response.status}: ${response.data}`);
    }

    let data: ImportedSchema;

    try {
      data = JSON.parse(response.data);
    } catch (error) {
      throw new Error(`Failed to parse schema: ${error}`);
    }

    return data;
  }

  static async main(argv: string[]) {
    const options = TypeBuilder.getServerAndOutputFromCli(argv);

    const schema = await TypeBuilder.getSchemaFromServer(options.serverUrl);

    const stringifiedData = TypeBuilder.convertSchemaToTypeScript(schema);

    fs.writeFileSync(options.outputFile, stringifiedData);
  }
}
