import { StartEndpointMock } from '@dungeonmaster/testing';

import { fetchDeleteAdapter } from './fetch-delete-adapter';

describe('fetchDeleteAdapter', () => {
  it('VALID: returns parsed JSON on success', async () => {
    const endpoint = StartEndpointMock.listen({ method: 'delete', url: '/test/endpoint' });
    endpoint.resolves({ data: { key: 'value' } });

    const result = await fetchDeleteAdapter({ url: '/test/endpoint' });

    expect(result).toStrictEqual({ key: 'value' });
  });

  it('ERROR: rejects on network error', async () => {
    const endpoint = StartEndpointMock.listen({ method: 'delete', url: '/test/endpoint' });
    endpoint.networkError();

    await expect(fetchDeleteAdapter({ url: '/test/endpoint' })).rejects.toThrow(/fetch/iu);
  });

  it('ERROR: {4xx with JSON {error} body} => rejects with the server error message', async () => {
    const endpoint = StartEndpointMock.listen({ method: 'delete', url: '/test/endpoint' });
    endpoint.responds({ status: 400, body: { error: 'Quest is currently running' } });

    await expect(fetchDeleteAdapter({ url: '/test/endpoint' })).rejects.toThrow(
      /^Quest is currently running$/u,
    );
  });

  it('ERROR: {non-ok status, no parseable {error} body} => rejects with the status fallback', async () => {
    const endpoint = StartEndpointMock.listen({ method: 'delete', url: '/test/endpoint' });
    endpoint.respondRaw({
      status: 500,
      body: 'Internal Server Error',
      headers: { 'Content-Type': 'text/plain' },
    });

    await expect(fetchDeleteAdapter({ url: '/test/endpoint' })).rejects.toThrow(
      /failed with status 500/u,
    );
  });
});
