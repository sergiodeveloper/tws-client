import type {
  InputTypeDefinition,
  OutputTypeDefinition,
  InvocationInputType,
  OutputType,
} from '@tws-js/common';
import axios, { AxiosResponse } from 'axios';

export type Logger = {
  error: (message: string) => void;
};

export type ImportedOperation = {
  title?: string;
  description?: string;
  input: InputTypeDefinition;
  output: OutputTypeDefinition;
};

export type ImportedSchema = {
  operations: {
    [operationName: string]: ImportedOperation;
  };
};

export class TwsClient<TwsSchema extends ImportedSchema> {
  private readonly url: string;
  private readonly headers: Record<string, string>;
  private readonly logger: Logger;
  private readonly httpAgent: unknown;
  private readonly httpsAgent: unknown;

  constructor(options: {
    url: string;
    headers?: Record<string, string>;
    logger?: Logger;
    httpAgent?: unknown;
    httpsAgent?: unknown;
  }) {
    this.url = options.url;
    this.headers = options.headers || {};
    this.logger = options.logger || console;
    this.httpAgent = options.httpAgent;
    this.httpsAgent = options.httpsAgent;
  }

  async execute<OperationName extends keyof TwsSchema['operations']>(
    operation: OperationName,
    input: InvocationInputType<TwsSchema['operations'][OperationName]['input']>,
  ): Promise<OutputType<TwsSchema['operations'][OperationName]['output']>> {
    const response: AxiosResponse<string> = await axios.request({
      url: this.url,
      method: 'POST',
      data: {
        operation,
        input,
      },
      headers: this.headers,
      responseType: 'text',
      httpAgent: this.httpAgent,
      httpsAgent: this.httpsAgent,
    });

    if (response.status !== 200) {
      this.logger.error(`Server responded with status code ${response.status}: ${response.data}`);
      throw new Error(`Server responded with status code ${response.status}`);
    }

    let data: {
      data: OutputType<TwsSchema['operations'][OperationName]['output']>;
      error?: string;
    };
    try {
      data = JSON.parse(response.data);
    } catch (error) {
      this.logger.error(`Server responded with invalid JSON: ${response.data}`);
      throw new Error(`Server responded with invalid JSON`);
    }

    if (data.error) {
      this.logger.error(`Server responded with error: ${JSON.stringify(data.error)}`);
      throw new Error(`Server responded with error`);
    }

    return data.data;
  }
}
