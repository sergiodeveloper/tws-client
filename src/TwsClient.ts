import type {
  InputTypeDefinition,
  OutputTypeDefinition,
  InvocationInputType,
  OutputType,
} from '@tws-js/common';
import axios, { AxiosResponse } from 'axios';

const WEBSOCKET_OPERATION_RESPONSE_TIMEOUT = 10000;

export type Logger = {
  error: (message: string) => void;
  info?: (message: string) => void;
};

export type ImportedOperation = {
  title?: string;
  description?: string;
  input: InputTypeDefinition;
  output: OutputTypeDefinition;
};

export type ImportedClientEvent = {
  title?: string;
  description?: string;
  input: InputTypeDefinition;
  output: OutputTypeDefinition;
};

export type ImportedServerEvent = {
  title?: string;
  description?: string;
  input: InputTypeDefinition;
  output: OutputTypeDefinition;
};

export type ImportedSchema = {
  operations: {
    [operationName: string]: ImportedOperation;
  };
  clientEvents: {
    [clientEventName: string]: ImportedClientEvent;
  };
  serverEvents: {
    [clientEventName: string]: ImportedServerEvent;
  };
};

export class TwsClient<TwsSchema extends ImportedSchema> {
  private readonly url: string;
  private readonly headers: Record<string, string>;
  private readonly logger: Logger;
  private serverEventSender: ((event: string) => void) | null = null;
  private eventListeners: {
    [eventName: string | symbol]:
      | ((
          event: InvocationInputType<
            TwsSchema['serverEvents'][keyof TwsSchema['serverEvents']]['input']
          >,
        ) =>
          | Promise<
              OutputType<TwsSchema['serverEvents'][keyof TwsSchema['serverEvents']]['output']>
            >
          | OutputType<TwsSchema['serverEvents'][keyof TwsSchema['serverEvents']]['output']>)
      | undefined;
  } = {};
  private responseListeners: {
    [eventId: string]:
      | ((
          event: OutputType<TwsSchema['clientEvents'][keyof TwsSchema['clientEvents']]['output']>,
        ) => void | Promise<void>)
      | undefined;
  } = {};

  constructor(options: { url: string; headers?: Record<string, string>; logger?: Logger }) {
    this.url = options.url;
    this.headers = options.headers || {};
    this.logger = options.logger || console;
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

  setServerEventSender(handler: (event: string) => void): void {
    this.serverEventSender = handler;
  }

  async processEventFromServer(rawEvent: string): Promise<void> {
    let event: {
      type: 'call' | 'response';
      operation: string;
      eventId: string;
      payload: string;
    };

    try {
      event = JSON.parse(rawEvent);
    } catch (error) {
      this.logger.error(`Server sent invalid JSON: ${rawEvent}`);
      return;
    }

    if (event.type === 'call') {
      this.logger.info?.(`Received call event from server: ${JSON.stringify(event)}`);

      let parsedPayload: InvocationInputType<
        TwsSchema['serverEvents'][keyof TwsSchema['serverEvents']]['input']
      >;
      try {
        parsedPayload = JSON.parse(event.payload);
      } catch (error) {
        this.logger.error(`Server sent invalid JSON payload: ${event.payload}`);
        return;
      }

      const listener = this.eventListeners[event.operation];

      if (!listener) {
        this.logger.error(`Server sent an event but there is no listener for it: ${event}`);
        return;
      }

      let response: OutputType<
        TwsSchema['serverEvents'][keyof TwsSchema['serverEvents']]['output']
      >;
      try {
        response = await listener(parsedPayload);
      } catch (error) {
        this.logger.error(`Listener for operation "${event.operation}" threw an error: ${error}`);
        return;
      }

      this.sendEventToServer({
        type: 'response',
        operation: event.operation,
        eventId: event.eventId,
        payload: JSON.stringify(response),
      });
    } else if (event.type === 'response') {
      this.logger.info?.(`Server sent a response: ${JSON.stringify(event)}`);

      let parsedPayload: OutputType<
        TwsSchema['clientEvents'][keyof TwsSchema['clientEvents']]['output']
      >;
      try {
        parsedPayload = JSON.parse(event.payload);
      } catch (error) {
        this.logger.error(`Server sent invalid JSON payload: ${event.payload}`);
        return;
      }

      const listener = this.responseListeners[event.eventId];

      if (listener) {
        listener(parsedPayload);
        delete this.responseListeners[event.eventId];
      }
    } else {
      this.logger.error(`Server sent unknown event type "${event.type}"`);
    }
  }

  private sendEventToServer(options: {
    type: 'call' | 'response';
    operation: string;
    eventId: string;
    payload: string;
  }): void {
    if (!this.serverEventSender) {
      this.logger.error(
        `Cannot send event to server because no handler was defined. Call setServerEventSender().`,
      );
      return;
    }

    const rawEvent = JSON.stringify({
      type: options.type,
      operation: options.operation,
      eventId: options.eventId,
      payload: options.payload,
    });

    this.logger.info?.(`Sending event to server: ${rawEvent}`);
    return this.serverEventSender(rawEvent);
  }

  private waitForResponse<ClientEventName extends keyof TwsSchema['clientEvents']>(
    eventId: string,
  ): Promise<OutputType<TwsSchema['clientEvents'][ClientEventName]['output']>> {
    return new Promise((resolve) => {
      const timeoutId = setTimeout(() => {
        this.logger.error(`Timeout while waiting for response to event ${eventId}`);
        delete this.responseListeners[eventId];
      }, WEBSOCKET_OPERATION_RESPONSE_TIMEOUT);

      this.responseListeners[eventId] = (event) => {
        delete this.responseListeners[eventId];
        clearTimeout(timeoutId);
        resolve(event);
      };
    });
  }

  async send<ClientEventName extends keyof TwsSchema['clientEvents']>(
    eventName: ClientEventName,
    input: InvocationInputType<TwsSchema['clientEvents'][ClientEventName]['input']>,
  ): Promise<OutputType<TwsSchema['clientEvents'][ClientEventName]['output']>> {
    const eventId = `event-${Math.floor(Math.random() * 1e10)}`;

    const promise = this.waitForResponse<ClientEventName>(eventId);

    this.sendEventToServer({
      type: 'call',
      operation: String(eventName),
      eventId,
      payload: JSON.stringify(input),
    });

    return await promise;
  }

  on<EventName extends keyof TwsSchema['serverEvents']>(
    eventName: EventName,
    listener: (
      event: InvocationInputType<TwsSchema['serverEvents'][EventName]['input']>,
    ) =>
      | Promise<OutputType<TwsSchema['serverEvents'][EventName]['output']>>
      | OutputType<TwsSchema['serverEvents'][EventName]['output']>,
  ): void {
    this.eventListeners[eventName] = listener;
  }
}
