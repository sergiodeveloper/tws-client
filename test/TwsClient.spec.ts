import axios from 'axios';
import { InputTypeDefinition, InvocationInputType } from '@tws-js/common';

import { TwsClient } from '../src/index';

describe('TwsClient', () => {
  afterEach(() => {
    jest.restoreAllMocks();
  });

  test('constructor', async () => {
    const headers = { test: 'ok' };
    const logger = { error: jest.fn() };

    const client = new TwsClient({
      url: 'http://localhost:1111',
      headers,
      logger,
    });

    expect(client).toBeDefined();
    expect(client.execute).toBeDefined();

    // eslint-disable-next-line @typescript-eslint/ban-ts-comment
    // @ts-ignore
    expect(client.url).toEqual('http://localhost:1111');
    // eslint-disable-next-line @typescript-eslint/ban-ts-comment
    // @ts-ignore
    expect(client.headers).toEqual(headers);
    // eslint-disable-next-line @typescript-eslint/ban-ts-comment
    // @ts-ignore
    expect(client.logger).toEqual(logger);
  });

  test('constructor with default headers and logger', async () => {
    const client = new TwsClient({
      url: 'http://localhost:4444',
    });

    expect(client).toBeDefined();
    expect(client.execute).toBeDefined();

    // eslint-disable-next-line @typescript-eslint/ban-ts-comment
    // @ts-ignore
    expect(client.url).toEqual('http://localhost:4444');
    // eslint-disable-next-line @typescript-eslint/ban-ts-comment
    // @ts-ignore
    expect(client.headers).toEqual({});
    // eslint-disable-next-line @typescript-eslint/ban-ts-comment
    // @ts-ignore
    expect(client.logger).toEqual(console);
  });

  test('execute', async () => {
    const headers = { test: 'ok' };
    const logger = { error: jest.fn() };

    const client = {
      url: 'http://localhost:3000',
      headers,
      logger,
    };

    const axiosRequestSpy = jest.spyOn(axios, 'request').mockResolvedValue({
      status: 200,
      data: JSON.stringify({
        data: 'ok',
      }),
    });

    const result = await TwsClient.prototype.execute.call(client, 'test', {
      a: 'input',
    });

    expect(result).toEqual('ok');
    expect(axiosRequestSpy).toHaveBeenCalledTimes(1);
    expect(axiosRequestSpy).toHaveBeenCalledWith({
      url: 'http://localhost:3000',
      method: 'POST',
      data: {
        operation: 'test',
        input: {
          a: 'input',
        },
      },
      headers: {
        test: 'ok',
      },
      responseType: 'text',
    });
  });

  test('execute with error on status code', async () => {
    const headers = { test: 'ok' };
    const logger = { error: jest.fn() };

    const client = {
      url: 'http://localhost:2222',
      headers,
      logger,
    };

    const axiosRequestSpy = jest.spyOn(axios, 'request').mockResolvedValue({
      status: 400,
      data: 'error',
    });

    await expect(
      TwsClient.prototype.execute.call(client, 'test', {
        a: 'input',
      }),
    ).rejects.toThrow('Server responded with status code 400');

    expect(logger.error).toHaveBeenCalledTimes(1);
    expect(logger.error).toHaveBeenCalledWith('Server responded with status code 400: error');

    expect(axiosRequestSpy).toHaveBeenCalledTimes(1);
    expect(axiosRequestSpy).toHaveBeenCalledWith({
      url: 'http://localhost:2222',
      method: 'POST',
      data: {
        operation: 'test',
        input: {
          a: 'input',
        },
      },
      headers: {
        test: 'ok',
      },
      responseType: 'text',
    });
  });

  test('execute with error on invalid JSON', async () => {
    const headers = { test: 'ok' };
    const logger = { error: jest.fn() };

    const client = {
      url: 'http://localhost:5555',
      headers,
      logger,
    };

    const axiosRequestSpy = jest.spyOn(axios, 'request').mockResolvedValue({
      status: 200,
      data: 'error',
    });

    await expect(
      TwsClient.prototype.execute.call(client, 'test', {
        a: 'input',
      }),
    ).rejects.toThrow('Server responded with invalid JSON');

    expect(logger.error).toHaveBeenCalledTimes(1);
    expect(logger.error).toHaveBeenCalledWith('Server responded with invalid JSON: error');

    expect(axiosRequestSpy).toHaveBeenCalledTimes(1);
    expect(axiosRequestSpy).toHaveBeenCalledWith({
      url: 'http://localhost:5555',
      method: 'POST',
      data: {
        operation: 'test',
        input: {
          a: 'input',
        },
      },
      headers: {
        test: 'ok',
      },
      responseType: 'text',
    });
  });

  test('execute with error on operation', async () => {
    const headers = { test: 'ok' };
    const logger = { error: jest.fn() };

    const client = {
      url: 'http://localhost:6666',
      headers,
      logger,
    };

    const axiosRequestSpy = jest.spyOn(axios, 'request').mockResolvedValue({
      status: 200,
      data: JSON.stringify({
        error: 'testError',
      }),
    });

    await expect(
      TwsClient.prototype.execute.call(client, 'test', {
        a: 'input',
      }),
    ).rejects.toThrow('error');

    expect(logger.error).toHaveBeenCalledTimes(1);
    expect(logger.error).toHaveBeenCalledWith('Server responded with error: "testError"');

    expect(axiosRequestSpy).toHaveBeenCalledTimes(1);
    expect(axiosRequestSpy).toHaveBeenCalledWith({
      url: 'http://localhost:6666',
      method: 'POST',
      data: {
        operation: 'test',
        input: {
          a: 'input',
        },
      },
      headers: {
        test: 'ok',
      },
      responseType: 'text',
    });
  });

  test('setServerEventSender', async () => {
    const thisInstance = {
      serverEventSender: undefined,
    };
    const serverEventSender = jest.fn();

    const result = TwsClient.prototype.setServerEventSender.call(thisInstance, serverEventSender);

    expect(result).toBeUndefined();

    expect(thisInstance.serverEventSender).toEqual(serverEventSender);
  });

  test('processEventFromServer with invalid JSON', async () => {
    const thisInstance = {
      logger: {
        error: jest.fn(),
        info: jest.fn(),
      },
      eventListeners: {
        testEvent: jest.fn().mockResolvedValue('testEventResponse'),
      },
      responseListeners: {
        testResponse: jest.fn(),
      },
      sendEventToServer: jest.fn(),
    };

    const event = 'Invalid JSON';

    const result = await TwsClient.prototype.processEventFromServer.call(thisInstance, event);

    expect(result).toBeUndefined();

    expect(thisInstance.logger.error).toHaveBeenCalledTimes(1);
    expect(thisInstance.logger.error).toHaveBeenCalledWith(`Server sent invalid JSON: ${event}`);

    expect(thisInstance.logger.info).not.toHaveBeenCalled();
    expect(thisInstance.eventListeners.testEvent).not.toHaveBeenCalled();
    expect(thisInstance.sendEventToServer).not.toHaveBeenCalled();
    expect(thisInstance.responseListeners.testResponse).not.toHaveBeenCalled();
  });

  test('processEventFromServer with invalid event', async () => {
    const thisInstance = {
      logger: {
        error: jest.fn(),
        info: jest.fn(),
      },
      eventListeners: {
        testEvent: jest.fn().mockResolvedValue('testEventResponse'),
      },
      responseListeners: {
        testResponse: jest.fn(),
      },
      sendEventToServer: jest.fn(),
    };

    const event = {
      type: 'call',
      operation: 'testEvent',
      eventId: 'testEventId',
    };

    const result = await TwsClient.prototype.processEventFromServer.call(
      thisInstance,
      JSON.stringify(event),
    );

    expect(result).toBeUndefined();

    expect(thisInstance.logger.error).toHaveBeenCalledTimes(1);
    expect(thisInstance.logger.error).toHaveBeenCalledWith(
      `Server sent an invalid event: ${JSON.stringify(event)}`,
    );

    expect(thisInstance.logger.info).not.toHaveBeenCalled();
    expect(thisInstance.eventListeners.testEvent).not.toHaveBeenCalled();
    expect(thisInstance.sendEventToServer).not.toHaveBeenCalled();
    expect(thisInstance.responseListeners.testResponse).not.toHaveBeenCalled();
  });

  test('processEventFromServer with call', async () => {
    const thisInstance = {
      logger: {
        error: jest.fn(),
        info: jest.fn(),
      },
      eventListeners: {
        testEvent: jest.fn().mockResolvedValue('testEventResponse'),
      },
      responseListeners: {
        testResponse: jest.fn(),
      },
      sendEventToServer: jest.fn(),
    };

    const event = {
      type: 'call',
      operation: 'testEvent',
      eventId: 'testEventId',
      payload: JSON.stringify('testPayload'),
    };

    const result = await TwsClient.prototype.processEventFromServer.call(
      thisInstance,
      JSON.stringify(event),
    );

    expect(result).toBeUndefined();

    expect(thisInstance.logger.info).toHaveBeenCalledTimes(1);
    expect(thisInstance.logger.info).toHaveBeenCalledWith(
      `Received call event from server: ${JSON.stringify(event)}`,
    );

    expect(thisInstance.eventListeners.testEvent).toHaveBeenCalledTimes(1);
    expect(thisInstance.eventListeners.testEvent).toHaveBeenCalledWith('testPayload');

    expect(thisInstance.sendEventToServer).toHaveBeenCalledTimes(1);
    expect(thisInstance.sendEventToServer).toHaveBeenCalledWith({
      type: 'response',
      operation: 'testEvent',
      eventId: 'testEventId',
      payload: JSON.stringify('testEventResponse'),
    });

    expect(thisInstance.responseListeners.testResponse).not.toHaveBeenCalled();
    expect(thisInstance.logger.error).not.toHaveBeenCalled();
  });

  test('processEventFromServer with call without info logger', async () => {
    const thisInstance = {
      logger: {
        error: jest.fn(),
      },
      eventListeners: {
        testEvent: jest.fn().mockResolvedValue('testEventResponse'),
      },
      responseListeners: {
        testResponse: jest.fn(),
      },
      sendEventToServer: jest.fn(),
    };

    const event = {
      type: 'call',
      operation: 'testEvent',
      eventId: 'testEventId',
      payload: JSON.stringify('testPayload'),
    };

    const result = await TwsClient.prototype.processEventFromServer.call(
      thisInstance,
      JSON.stringify(event),
    );

    expect(result).toBeUndefined();
  });

  test('processEventFromServer with invalid payload in call event', async () => {
    const thisInstance = {
      logger: {
        error: jest.fn(),
        info: jest.fn(),
      },
      eventListeners: {
        testEvent: jest.fn().mockResolvedValue('testEventResponse'),
      },
      responseListeners: {
        testResponse: jest.fn(),
      },
      sendEventToServer: jest.fn(),
    };

    const event = {
      type: 'call',
      operation: 'testEvent',
      eventId: 'testEventId',
      payload: 'Invalid JSON',
    };

    const result = await TwsClient.prototype.processEventFromServer.call(
      thisInstance,
      JSON.stringify(event),
    );

    expect(result).toBeUndefined();

    expect(thisInstance.logger.error).toHaveBeenCalledTimes(1);
    expect(thisInstance.logger.error).toHaveBeenCalledWith(
      'Server sent invalid JSON payload: Invalid JSON',
    );

    expect(thisInstance.logger.info).toHaveBeenCalledTimes(1);
    expect(thisInstance.logger.info).toHaveBeenCalledWith(
      `Received call event from server: ${JSON.stringify(event)}`,
    );

    expect(thisInstance.eventListeners.testEvent).not.toHaveBeenCalled();
    expect(thisInstance.sendEventToServer).not.toHaveBeenCalled();
    expect(thisInstance.responseListeners.testResponse).not.toHaveBeenCalled();
  });

  test('processEventFromServer with call and missing event listener', async () => {
    const thisInstance = {
      logger: {
        error: jest.fn(),
        info: jest.fn(),
      },
      eventListeners: {},
      responseListeners: {
        testResponse: jest.fn(),
      },
      sendEventToServer: jest.fn(),
    };

    const event = {
      type: 'call',
      operation: 'testEvent',
      eventId: 'testEventId',
      payload: JSON.stringify('testPayload'),
    };

    const result = await TwsClient.prototype.processEventFromServer.call(
      thisInstance,
      JSON.stringify(event),
    );

    expect(result).toBeUndefined();

    expect(thisInstance.logger.info).toHaveBeenCalledTimes(1);
    expect(thisInstance.logger.info).toHaveBeenCalledWith(
      `Received call event from server: ${JSON.stringify(event)}`,
    );

    expect(thisInstance.logger.error).toHaveBeenCalledTimes(1);
    expect(thisInstance.logger.error).toHaveBeenCalledWith(
      `Server sent an event but there is no listener for it: ${JSON.stringify(event)}`,
    );

    expect(thisInstance.sendEventToServer).not.toHaveBeenCalled();
    expect(thisInstance.responseListeners.testResponse).not.toHaveBeenCalled();
  });

  test('processEventFromServer with call and error in event listener', async () => {
    const thisInstance = {
      logger: {
        error: jest.fn(),
        info: jest.fn(),
      },
      eventListeners: {
        testEvent: jest.fn().mockRejectedValue(new Error('testError')),
      },
      responseListeners: {
        testResponse: jest.fn(),
      },
      sendEventToServer: jest.fn(),
    };

    const event = {
      type: 'call',
      operation: 'testEvent',
      eventId: 'testEventId',
      payload: JSON.stringify('testPayload'),
    };

    const result = await TwsClient.prototype.processEventFromServer.call(
      thisInstance,
      JSON.stringify(event),
    );

    expect(result).toBeUndefined();

    expect(thisInstance.logger.info).toHaveBeenCalledTimes(1);
    expect(thisInstance.logger.info).toHaveBeenCalledWith(
      `Received call event from server: ${JSON.stringify(event)}`,
    );

    expect(thisInstance.logger.error).toHaveBeenCalledTimes(1);
    expect(thisInstance.logger.error).toHaveBeenCalledWith(
      `Listener for operation "${event.operation}" threw an error: Error: testError`,
    );

    expect(thisInstance.sendEventToServer).not.toHaveBeenCalled();
    expect(thisInstance.responseListeners.testResponse).not.toHaveBeenCalled();
  });

  test('processEventFromServer with response', async () => {
    const responseListener = jest.fn();

    const thisInstance = {
      logger: {
        error: jest.fn(),
        info: jest.fn(),
      },
      eventListeners: {
        testEvent: jest.fn(),
      },
      responseListeners: {
        testEventId: responseListener,
      },
      sendEventToServer: jest.fn(),
    };

    const event = {
      type: 'response',
      operation: 'testResponse',
      eventId: 'testEventId',
      payload: JSON.stringify('testPayload'),
    };

    const result = await TwsClient.prototype.processEventFromServer.call(
      thisInstance,
      JSON.stringify(event),
    );

    expect(result).toBeUndefined();

    expect(thisInstance.logger.info).toHaveBeenCalledTimes(1);
    expect(thisInstance.logger.info).toHaveBeenCalledWith(
      `Server sent a response: ${JSON.stringify(event)}`,
    );

    expect(thisInstance.responseListeners.testEventId).toEqual(undefined);
    expect(responseListener).toHaveBeenCalledTimes(1);
    expect(responseListener).toHaveBeenCalledWith('testPayload');

    expect(thisInstance.eventListeners.testEvent).not.toHaveBeenCalled();
    expect(thisInstance.sendEventToServer).not.toHaveBeenCalled();
    expect(thisInstance.logger.error).not.toHaveBeenCalled();
  });

  test('processEventFromServer with response without info logger', async () => {
    const responseListener = jest.fn();

    const thisInstance = {
      logger: {
        error: jest.fn(),
      },
      eventListeners: {
        testEvent: jest.fn(),
      },
      responseListeners: {
        testEventId: responseListener,
      },
      sendEventToServer: jest.fn(),
    };

    const event = {
      type: 'response',
      operation: 'testResponse',
      eventId: 'testEventId',
      payload: JSON.stringify('testPayload'),
    };

    const result = await TwsClient.prototype.processEventFromServer.call(
      thisInstance,
      JSON.stringify(event),
    );

    expect(result).toBeUndefined();
  });

  test('processEventFromServer with response and invalid payload', async () => {
    const thisInstance = {
      logger: {
        error: jest.fn(),
        info: jest.fn(),
      },
      eventListeners: {
        testEvent: jest.fn(),
      },
      responseListeners: {
        testEventId: jest.fn(),
      },
      sendEventToServer: jest.fn(),
    };

    const event = {
      type: 'response',
      operation: 'testResponse',
      eventId: 'testEventId',
      payload: 'invalidJson',
    };

    const result = await TwsClient.prototype.processEventFromServer.call(
      thisInstance,
      JSON.stringify(event),
    );

    expect(result).toBeUndefined();

    expect(thisInstance.logger.error).toHaveBeenCalledTimes(1);
    expect(thisInstance.logger.error).toHaveBeenCalledWith(
      'Server sent invalid JSON payload: invalidJson',
    );

    expect(thisInstance.logger.info).toHaveBeenCalledTimes(1);
    expect(thisInstance.logger.info).toHaveBeenCalledWith(
      `Server sent a response: ${JSON.stringify(event)}`,
    );

    expect(thisInstance.responseListeners.testEventId).not.toHaveBeenCalled();
    expect(thisInstance.eventListeners.testEvent).not.toHaveBeenCalled();
    expect(thisInstance.sendEventToServer).not.toHaveBeenCalled();
  });

  test('processEventFromServer with an unknown event type', async () => {
    const thisInstance = {
      logger: {
        error: jest.fn(),
        info: jest.fn(),
      },
      eventListeners: {
        testEvent: jest.fn(),
      },
      responseListeners: {
        testEventId: jest.fn(),
      },
      sendEventToServer: jest.fn(),
    };

    const event = {
      type: 'unknown',
      operation: 'testResponse',
      eventId: 'testEventId',
      payload: JSON.stringify('testPayload'),
    };

    const result = await TwsClient.prototype.processEventFromServer.call(
      thisInstance,
      JSON.stringify(event),
    );

    expect(result).toBeUndefined();

    expect(thisInstance.logger.error).toHaveBeenCalledTimes(1);
    expect(thisInstance.logger.error).toHaveBeenCalledWith(
      `Server sent unknown event type: "${event.type}"`,
    );

    expect(thisInstance.logger.info).not.toHaveBeenCalled();

    expect(thisInstance.responseListeners.testEventId).not.toHaveBeenCalled();
    expect(thisInstance.eventListeners.testEvent).not.toHaveBeenCalled();
    expect(thisInstance.sendEventToServer).not.toHaveBeenCalled();
  });

  test('sendEventToServer', () => {
    const thisInstance = {
      logger: {
        error: jest.fn(),
        info: jest.fn(),
      },
      serverEventSender: jest.fn(),
    };

    const event = {
      type: 'call' as const,
      operation: 'testEvent',
      eventId: 'testEventId',
      payload: JSON.stringify('testPayload'),
    };

    // eslint-disable-next-line @typescript-eslint/ban-ts-comment
    // @ts-ignore
    const result = TwsClient.prototype.sendEventToServer.call(thisInstance, event);

    expect(result).toBeUndefined();

    expect(thisInstance.logger.info).toHaveBeenCalledTimes(1);
    expect(thisInstance.logger.info).toHaveBeenCalledWith(
      `Sending event to server: ${JSON.stringify(event)}`,
    );

    expect(thisInstance.serverEventSender).toHaveBeenCalledTimes(1);
    expect(thisInstance.serverEventSender).toHaveBeenCalledWith(JSON.stringify(event));
  });

  test('sendEventToServer without info logger', () => {
    const thisInstance = {
      logger: {
        error: jest.fn(),
      },
      serverEventSender: jest.fn(),
    };

    const event = {
      type: 'call' as const,
      operation: 'testEvent',
      eventId: 'testEventId',
      payload: JSON.stringify('testPayload'),
    };

    // eslint-disable-next-line @typescript-eslint/ban-ts-comment
    // @ts-ignore
    const result = TwsClient.prototype.sendEventToServer.call(thisInstance, event);

    expect(result).toBeUndefined();
  });

  test('sendEventToServer with missing server event sender', () => {
    const thisInstance = {
      logger: {
        error: jest.fn(),
        info: jest.fn(),
      },
    };

    const event = {
      type: 'call' as const,
      operation: 'testEvent',
      eventId: 'testEventId',
      payload: JSON.stringify('testPayload'),
    };

    // eslint-disable-next-line @typescript-eslint/ban-ts-comment
    // @ts-ignore
    const result = TwsClient.prototype.sendEventToServer.call(thisInstance, event);

    expect(result).toBeUndefined();

    expect(thisInstance.logger.error).toHaveBeenCalledTimes(1);
    expect(thisInstance.logger.error).toHaveBeenCalledWith(
      `Cannot send event to server because no handler was defined. Call setServerEventSender().`,
    );

    expect(thisInstance.logger.info).not.toHaveBeenCalled();
  });

  test('waitForResponse', async () => {
    jest.spyOn(global, 'setTimeout').mockImplementation();
    jest.spyOn(global, 'clearTimeout').mockImplementation();

    const thisInstance = {
      logger: {
        error: jest.fn(),
        info: jest.fn(),
      },
      responseListeners: {
        testEventId: undefined,
      },
    };

    // eslint-disable-next-line @typescript-eslint/ban-ts-comment
    // @ts-ignore
    const promise = TwsClient.prototype.waitForResponse.call(thisInstance, 'testEventId');
    expect(promise).toBeInstanceOf(Promise);

    expect(thisInstance.responseListeners.testEventId).toBeInstanceOf(Function);

    expect(global.setTimeout).toHaveBeenCalledTimes(1);
    expect(global.setTimeout).toHaveBeenCalledWith(expect.any(Function), 10000);
  });

  test('waitForResponse receiving a response', async () => {
    jest
      .spyOn(global, 'setTimeout')
      .mockImplementation()
      .mockReturnValue(123 as unknown as NodeJS.Timeout);
    jest.spyOn(global, 'clearTimeout').mockImplementation();

    const thisInstance = {
      logger: {
        error: jest.fn(),
        info: jest.fn(),
      },
      responseListeners: {
        testEventId: jest.fn(),
      },
    };

    // eslint-disable-next-line @typescript-eslint/ban-ts-comment
    // @ts-ignore
    const promise = TwsClient.prototype.waitForResponse.call(thisInstance, 'testEventId');
    expect(promise).toBeInstanceOf(Promise);

    expect(thisInstance.responseListeners.testEventId).toBeInstanceOf(Function);

    const responseListener = thisInstance.responseListeners.testEventId;

    expect(global.setTimeout).toHaveBeenCalledTimes(1);
    expect(global.setTimeout).toHaveBeenCalledWith(expect.any(Function), 10000);

    responseListener('testPayload');

    expect(thisInstance.responseListeners.testEventId).toBeUndefined();

    const result = await promise;
    expect(result).toEqual('testPayload');

    expect(global.clearTimeout).toHaveBeenCalledTimes(1);
    expect(global.clearTimeout).toHaveBeenCalledWith(123);
  });

  test('waitForResponse timing out', async () => {
    jest
      .spyOn(global, 'setTimeout')
      .mockImplementation()
      .mockReturnValue(123 as unknown as NodeJS.Timeout);
    jest.spyOn(global, 'clearTimeout').mockImplementation();

    const thisInstance = {
      logger: {
        error: jest.fn(),
        info: jest.fn(),
      },
      responseListeners: {
        testEventId: jest.fn(),
      },
    };

    // eslint-disable-next-line @typescript-eslint/ban-ts-comment
    // @ts-ignore
    const promise = TwsClient.prototype.waitForResponse.call(thisInstance, 'testEventId');
    expect(promise).toBeInstanceOf(Promise);

    expect(thisInstance.responseListeners.testEventId).toBeInstanceOf(Function);

    expect(global.setTimeout).toHaveBeenCalledTimes(1);
    expect(global.setTimeout).toHaveBeenCalledWith(expect.any(Function), 10000);

    // eslint-disable-next-line @typescript-eslint/ban-ts-comment
    // @ts-ignore
    const timeoutCallback = global.setTimeout.mock.calls[0][0];
    timeoutCallback();

    expect(thisInstance.responseListeners.testEventId).toBeUndefined();

    expect(thisInstance.logger.error).toHaveBeenCalledTimes(1);
    expect(thisInstance.logger.error).toHaveBeenCalledWith(
      `Timeout while waiting for response to event "testEventId"`,
    );

    await expect(promise).rejects.toThrow(
      `Timeout while waiting for response to event "testEventId"`,
    );

    expect(global.clearTimeout).not.toHaveBeenCalled();
  });

  test('send', async () => {
    const thisInstance = {
      sendEventToServer: jest.fn(),
      waitForResponse: jest.fn().mockResolvedValue('testPayload'),
    };

    const eventName = 'testEvent';
    const input = 'testInput' as unknown as InvocationInputType<InputTypeDefinition>;

    const result = await TwsClient.prototype.send.call(thisInstance, eventName, input);

    expect(result).toEqual('testPayload');

    expect(thisInstance.sendEventToServer).toHaveBeenCalledTimes(1);
    expect(thisInstance.sendEventToServer).toHaveBeenCalledWith({
      type: 'call',
      operation: eventName,
      eventId: expect.stringMatching(/^event-[0-9]+$/),
      payload: JSON.stringify(input),
    });

    expect(thisInstance.waitForResponse).toHaveBeenCalledTimes(1);
    expect(thisInstance.waitForResponse).toHaveBeenCalledWith(
      expect.stringMatching(/^event-[0-9]+$/),
    );
  });

  test('on', () => {
    const thisInstance = {
      eventListeners: {
        testEvent: undefined,
      },
    };

    const eventName = 'testEvent';
    const listener = jest.fn();

    const result = TwsClient.prototype.on.call(thisInstance, eventName, listener);

    expect(result).toBeUndefined();

    expect(thisInstance.eventListeners[eventName]).toEqual(listener);
  });
});
