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

  it('ERROR: rejects on non-ok status', async () => {
    const endpoint = StartEndpointMock.listen({ method: 'delete', url: '/test/endpoint' });
    endpoint.responds({ status: 404 });

    await expect(fetchDeleteAdapter({ url: '/test/endpoint' })).rejects.toThrow(
      /failed with status 404/u,
    );
  });
});
