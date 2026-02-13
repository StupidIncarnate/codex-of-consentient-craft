import { StartEndpointMock } from '@dungeonmaster/testing';

import { fetchPostAdapter } from './fetch-post-adapter';

describe('fetchPostAdapter', () => {
  it('VALID: returns parsed JSON on success', async () => {
    const endpoint = StartEndpointMock.listen({ method: 'post', url: '/test/endpoint' });
    endpoint.resolves({ data: { key: 'value' } });

    const result = await fetchPostAdapter({ url: '/test/endpoint', body: { payload: 'data' } });

    expect(result).toStrictEqual({ key: 'value' });
  });

  it('ERROR: rejects on network error', async () => {
    const endpoint = StartEndpointMock.listen({ method: 'post', url: '/test/endpoint' });
    endpoint.networkError();

    await expect(
      fetchPostAdapter({ url: '/test/endpoint', body: { payload: 'data' } }),
    ).rejects.toThrow(/fetch/iu);
  });

  it('ERROR: rejects on non-ok status', async () => {
    const endpoint = StartEndpointMock.listen({ method: 'post', url: '/test/endpoint' });
    endpoint.responds({ status: 500 });

    await expect(
      fetchPostAdapter({ url: '/test/endpoint', body: { payload: 'data' } }),
    ).rejects.toThrow(/failed with status 500/u);
  });
});
