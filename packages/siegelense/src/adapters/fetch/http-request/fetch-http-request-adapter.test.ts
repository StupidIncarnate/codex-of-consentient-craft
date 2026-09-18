import { HttpRequestReadingStub } from '../../../contracts/http-request-reading/http-request-reading.stub';
import { fetchHttpRequestAdapter } from './fetch-http-request-adapter';
import { fetchHttpRequestAdapterProxy } from './fetch-http-request-adapter.proxy';

describe('fetchHttpRequestAdapter', () => {
  describe('successful requests', () => {
    it('VALID: {GET, json response} => returns parsed HttpRequestReading with json body', async () => {
      const proxy = fetchHttpRequestAdapterProxy();
      const url = 'http://127.0.0.1:34172/api/guilds';
      proxy.setupResponse({
        url,
        status: 200,
        statusText: 'OK',
        headers: { 'content-type': 'application/json' },
        body: { id: 'guild-1' },
      });

      const result = await fetchHttpRequestAdapter({ url, method: 'GET' });

      expect(result).toStrictEqual(
        HttpRequestReadingStub({
          status: 200,
          statusText: 'OK',
          headers: { 'content-type': 'application/json' },
          body: { id: 'guild-1' },
        }),
      );
    });

    it('VALID: {POST, object body} => serializes body and sets application/json content-type', async () => {
      const proxy = fetchHttpRequestAdapterProxy();
      const url = 'http://127.0.0.1:34172/api/guilds';
      proxy.setupResponse({
        url,
        status: 201,
        statusText: 'Created',
        headers: {},
        body: { success: true },
      });

      const result = await fetchHttpRequestAdapter({
        url,
        method: 'POST',
        body: { name: 'test-guild' },
      });

      expect(result).toStrictEqual(
        HttpRequestReadingStub({
          status: 201,
          statusText: 'Created',
          headers: {},
          body: { success: true },
        }),
      );
    });

    it('VALID: {POST, string body with existing content-type} => keeps existing content-type', async () => {
      const proxy = fetchHttpRequestAdapterProxy();
      const url = 'http://127.0.0.1:34172/api/raw';
      proxy.setupResponse({
        url,
        status: 200,
        statusText: 'OK',
        headers: { 'content-type': 'text/plain' },
        body: 'plain text response',
      });

      const result = await fetchHttpRequestAdapter({
        url,
        method: 'POST',
        headers: { 'Content-Type': 'text/plain' },
        body: 'raw string body',
      });

      expect(result).toStrictEqual(
        HttpRequestReadingStub({
          status: 200,
          statusText: 'OK',
          headers: { 'content-type': 'text/plain' },
          body: 'plain text response',
        }),
      );
    });

    it('VALID: {non-json response} => falls back to raw string body', async () => {
      const proxy = fetchHttpRequestAdapterProxy();
      const url = 'http://127.0.0.1:34172/api/text';
      proxy.setupResponse({
        url,
        status: 200,
        statusText: 'OK',
        headers: {},
        body: 'plain text not json',
      });

      const result = await fetchHttpRequestAdapter({ url, method: 'GET' });

      expect(result).toStrictEqual(
        HttpRequestReadingStub({
          status: 200,
          statusText: 'OK',
          headers: {},
          body: 'plain text not json',
        }),
      );
    });

    it('VALID: {custom timeoutMs} => completes within custom timeout', async () => {
      const proxy = fetchHttpRequestAdapterProxy();
      const url = 'http://127.0.0.1:34172/api/timeout-test';
      proxy.setupResponse({
        url,
        status: 200,
        statusText: 'OK',
        headers: {},
        body: {},
      });

      const result = await fetchHttpRequestAdapter({ url, method: 'GET', timeoutMs: 5000 });

      expect(result).toStrictEqual(
        HttpRequestReadingStub({
          status: 200,
          statusText: 'OK',
          headers: {},
          body: {},
        }),
      );
    });
  });

  describe('error cases', () => {
    it('ERROR: {network error} => propagates rejection upward', async () => {
      const proxy = fetchHttpRequestAdapterProxy();
      const url = 'http://127.0.0.1:34172/api/error';
      const networkError = new Error('connect ECONNREFUSED 127.0.0.1:34172');
      proxy.setupRejection({ url, error: networkError });

      await expect(fetchHttpRequestAdapter({ url, method: 'GET' })).rejects.toThrow(
        /ECONNREFUSED/u,
      );
    });
  });
});
