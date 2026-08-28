import { StartEndpointMock } from '@dungeonmaster/testing';

import { fetchGetWithStatusAdapter } from './fetch-get-with-status-adapter';

describe('fetchGetWithStatusAdapter', () => {
  it('VALID: {200 JSON response} => returns status, ok, and parsed body', async () => {
    const endpoint = StartEndpointMock.listen({ method: 'get', url: '/test/endpoint' });
    endpoint.resolves({ data: { key: 'value' } });

    const result = await fetchGetWithStatusAdapter({ url: '/test/endpoint' });

    expect(result).toStrictEqual({
      status: 200,
      ok: true,
      body: { key: 'value' },
    });
  });

  it('VALID: {500 JSON response} => returns status 500 with parsed body without throwing', async () => {
    const endpoint = StartEndpointMock.listen({ method: 'get', url: '/test/endpoint' });
    endpoint.responds({ status: 500, body: { error: 'server exploded' } });

    const result = await fetchGetWithStatusAdapter({ url: '/test/endpoint' });

    expect(result).toStrictEqual({
      status: 500,
      ok: false,
      body: { error: 'server exploded' },
    });
  });

  it('VALID: {non-JSON text body} => returns raw text body', async () => {
    const endpoint = StartEndpointMock.listen({ method: 'get', url: '/test/endpoint' });
    endpoint.respondRaw({ status: 500, body: 'plain failure', headers: {} });

    const result = await fetchGetWithStatusAdapter({ url: '/test/endpoint' });

    expect(result).toStrictEqual({
      status: 500,
      ok: false,
      body: 'plain failure',
    });
  });

  it('EMPTY: {204 empty body} => returns body null', async () => {
    const endpoint = StartEndpointMock.listen({ method: 'get', url: '/test/endpoint' });
    endpoint.responds({ status: 204 });

    const result = await fetchGetWithStatusAdapter({ url: '/test/endpoint' });

    expect(result).toStrictEqual({
      status: 204,
      ok: true,
      body: null,
    });
  });

  it('ERROR: {network failure} => rejects', async () => {
    const endpoint = StartEndpointMock.listen({ method: 'get', url: '/test/endpoint' });
    endpoint.networkError();

    await expect(fetchGetWithStatusAdapter({ url: '/test/endpoint' })).rejects.toThrow(/fetch/iu);
  });
});
