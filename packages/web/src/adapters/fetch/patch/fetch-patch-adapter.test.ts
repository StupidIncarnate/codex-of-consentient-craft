import { StartEndpointMock } from '@dungeonmaster/testing';

import { fetchPatchAdapter } from './fetch-patch-adapter';

describe('fetchPatchAdapter', () => {
  it('VALID: returns parsed JSON on success', async () => {
    const endpoint = StartEndpointMock.listen({ method: 'patch', url: '/test/endpoint' });
    endpoint.resolves({ data: { key: 'value' } });

    const result = await fetchPatchAdapter({ url: '/test/endpoint', body: { payload: 'data' } });

    expect(result).toStrictEqual({ key: 'value' });
  });

  it('ERROR: rejects on network error', async () => {
    const endpoint = StartEndpointMock.listen({ method: 'patch', url: '/test/endpoint' });
    endpoint.networkError();

    await expect(
      fetchPatchAdapter({ url: '/test/endpoint', body: { payload: 'data' } }),
    ).rejects.toThrow(/fetch/iu);
  });

  it('ERROR: rejects on non-ok status', async () => {
    const endpoint = StartEndpointMock.listen({ method: 'patch', url: '/test/endpoint' });
    endpoint.responds({ status: 422 });

    await expect(
      fetchPatchAdapter({ url: '/test/endpoint', body: { payload: 'data' } }),
    ).rejects.toThrow(/failed with status 422/u);
  });
});
