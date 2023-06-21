import axios from 'axios';

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

  test('execute without input', async () => {
    const headers = { test: 'ok' };
    const logger = { error: jest.fn() };

    const client = {
      url: 'http://localhost:3300',
      headers,
      logger,
    };

    const axiosRequestSpy = jest.spyOn(axios, 'request').mockResolvedValue({
      status: 200,
      data: JSON.stringify({
        data: 'ok',
      }),
    });

    const result = await TwsClient.prototype.execute.call(client, 'test');

    expect(result).toEqual('ok');
    expect(axiosRequestSpy).toHaveBeenCalledTimes(1);
    expect(axiosRequestSpy).toHaveBeenCalledWith({
      url: 'http://localhost:3300',
      method: 'POST',
      data: {
        operation: 'test',
        input: {},
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
});
