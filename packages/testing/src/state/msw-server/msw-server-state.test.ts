import { http, HttpResponse } from '#gateway/npm/msw';

import { mswServerState } from './msw-server-state';
import { mswServerStateProxy } from './msw-server-state.proxy';

const parseBody = async (response: Response): Promise<unknown> =>
  JSON.parse(JSON.stringify(await response.json())) as unknown;

describe('mswServerState', () => {
  describe('get', () => {
    it('VALID: {called twice} => returns the same server instance', () => {
      mswServerStateProxy();

      const first = mswServerState.get();
      const second = mswServerState.get();

      expect(Object.is(first, second)).toBe(true);
    });
  });

  describe('request interception', () => {
    it('VALID: {GET handler} => intercepts and returns JSON response', async () => {
      mswServerStateProxy();

      const server = mswServerState.get();

      server.use(http.get('http://test.local/api/items', () => HttpResponse.json([{ id: '1' }])));

      const response = await fetch('http://test.local/api/items');
      const body = await parseBody(response);

      expect(body).toStrictEqual([{ id: '1' }]);
    });

    it('VALID: {POST handler with status} => intercepts POST and returns custom status', async () => {
      mswServerStateProxy();

      const CREATED = 201;
      const server = mswServerState.get();

      server.use(
        http.post('http://test.local/api/items', () =>
          HttpResponse.json({ created: true }, { status: CREATED }),
        ),
      );

      const response = await fetch('http://test.local/api/items', {
        method: 'POST',
        body: JSON.stringify({ name: 'test' }),
      });
      const body = await parseBody(response);

      expect(response.status).toBe(CREATED);
      expect(body).toStrictEqual({ created: true });
    });

    it('VALID: {error handler} => produces network error on fetch', async () => {
      mswServerStateProxy();

      const server = mswServerState.get();

      server.use(http.get('http://test.local/api/error', () => HttpResponse.error()));

      await expect(fetch('http://test.local/api/error')).rejects.toThrow(/fetch/iu);
    });
  });
});
