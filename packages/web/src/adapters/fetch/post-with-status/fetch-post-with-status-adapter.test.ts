import { StartEndpointMock } from '@dungeonmaster/testing';

import { fetchPostWithStatusAdapter } from './fetch-post-with-status-adapter';

describe('fetchPostWithStatusAdapter', () => {
  it('VALID: {200 JSON response} => returns status, ok, and parsed body', async () => {
    const endpoint = StartEndpointMock.listen({ method: 'post', url: '/test/endpoint' });
    endpoint.resolves({ data: { key: 'value' } });

    const result = await fetchPostWithStatusAdapter({
      url: '/test/endpoint',
      body: { payload: 'data' },
    });

    expect(result).toStrictEqual({
      status: 200,
      ok: true,
      body: { key: 'value' },
    });
  });

  it('VALID: {409 JSON response} => returns status 409 with parsed body without throwing', async () => {
    const endpoint = StartEndpointMock.listen({ method: 'post', url: '/test/endpoint' });
    endpoint.responds({ status: 409, body: { allowed: false, reason: 'loop owns the queue' } });

    const result = await fetchPostWithStatusAdapter({
      url: '/test/endpoint',
      body: { payload: 'data' },
    });

    expect(result).toStrictEqual({
      status: 409,
      ok: false,
      body: { allowed: false, reason: 'loop owns the queue' },
    });
  });

  it('EMPTY: {204 empty body} => returns body null', async () => {
    const endpoint = StartEndpointMock.listen({ method: 'post', url: '/test/endpoint' });
    endpoint.responds({ status: 204 });

    const result = await fetchPostWithStatusAdapter({
      url: '/test/endpoint',
      body: { payload: 'data' },
    });

    expect(result).toStrictEqual({
      status: 204,
      ok: true,
      body: null,
    });
  });

  it('VALID: {non-JSON text body} => returns raw text body', async () => {
    const endpoint = StartEndpointMock.listen({ method: 'post', url: '/test/endpoint' });
    endpoint.respondRaw({ status: 500, body: 'plain failure', headers: {} });

    const result = await fetchPostWithStatusAdapter({
      url: '/test/endpoint',
      body: { payload: 'data' },
    });

    expect(result).toStrictEqual({
      status: 500,
      ok: false,
      body: 'plain failure',
    });
  });

  it('ERROR: {network failure} => rejects', async () => {
    const endpoint = StartEndpointMock.listen({ method: 'post', url: '/test/endpoint' });
    endpoint.networkError();

    await expect(
      fetchPostWithStatusAdapter({ url: '/test/endpoint', body: { payload: 'data' } }),
    ).rejects.toThrow(/fetch/iu);
  });
});
