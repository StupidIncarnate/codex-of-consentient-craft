import { StartEndpointMock } from '@dungeonmaster/testing';

import { fetchGetAdapter } from './fetch-get-adapter';

describe('fetchGetAdapter', () => {
  it('VALID: returns parsed JSON on success', async () => {
    const endpoint = StartEndpointMock.listen({
      method: 'get',
      url: '/test/endpoint',
    });
    endpoint.resolves({ data: { key: 'value' } });

    const result = await fetchGetAdapter({ url: '/test/endpoint' });

    expect(result).toStrictEqual({ key: 'value' });
  });

  it('ERROR: rejects on network error', async () => {
    const endpoint = StartEndpointMock.listen({
      method: 'get',
      url: '/test/endpoint',
    });
    endpoint.networkError();

    await expect(fetchGetAdapter({ url: '/test/endpoint' })).rejects.toThrow(/fetch/iu);
  });

  it('ERROR: rejects on non-ok status', async () => {
    const endpoint = StartEndpointMock.listen({
      method: 'get',
      url: '/test/endpoint',
    });
    endpoint.responds({ status: 404 });

    await expect(fetchGetAdapter({ url: '/test/endpoint' })).rejects.toThrow(
      /failed with status 404/u,
    );
  });
});
