import { mswResponseToNetworkEntryTransformer } from './msw-response-to-network-entry-transformer';
import { NetworkLogEntryStub } from '../../contracts/network-log-entry/network-log-entry.stub';

describe('mswResponseToNetworkEntryTransformer', () => {
  describe('response body capture', () => {
    it('VALID: {response with JSON body} => returns entry with responseBody', async () => {
      const stub = NetworkLogEntryStub();
      const response = new Response('{"id":"123"}', { status: 200 });

      const result = await mswResponseToNetworkEntryTransformer({
        method: stub.method,
        url: stub.url,
        status: stub.status,
        durationMs: stub.durationMs,
        source: 'mock',
        response,
      });

      expect(result).toStrictEqual({
        method: stub.method,
        url: stub.url,
        status: stub.status,
        durationMs: stub.durationMs,
        requestBody: undefined,
        responseBody: '{"id":"123"}',
        source: 'mock',
      });
    });

    it('VALID: {response with request body} => returns entry with both bodies', async () => {
      const stub = NetworkLogEntryStub({ method: 'POST', requestBody: '{"name":"test"}' });
      const response = new Response('{"created":true}', { status: 201 });

      const result = await mswResponseToNetworkEntryTransformer({
        method: stub.method,
        url: stub.url,
        status: stub.status,
        durationMs: stub.durationMs,
        source: 'bypass',
        response,
        requestBody: stub.requestBody,
      });

      expect(result).toStrictEqual({
        method: stub.method,
        url: stub.url,
        status: stub.status,
        durationMs: stub.durationMs,
        requestBody: '{"name":"test"}',
        responseBody: '{"created":true}',
        source: 'bypass',
      });
    });

    it('VALID: {empty response body} => returns entry without responseBody', async () => {
      const stub = NetworkLogEntryStub({ method: 'DELETE' });
      const response = new Response(null, { status: 200 });

      const result = await mswResponseToNetworkEntryTransformer({
        method: stub.method,
        url: stub.url,
        status: stub.status,
        durationMs: stub.durationMs,
        source: 'mock',
        response,
      });

      expect(result).toStrictEqual({
        method: stub.method,
        url: stub.url,
        status: stub.status,
        durationMs: stub.durationMs,
        requestBody: undefined,
        responseBody: undefined,
        source: 'mock',
      });
    });
  });
});
