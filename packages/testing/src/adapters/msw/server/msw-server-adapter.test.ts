import { http, HttpResponse } from 'msw';

import { mswServerAdapter } from './msw-server-adapter';
import { mswServerAdapterProxy } from './msw-server-adapter.proxy';

const parseBody = async (response: Response): Promise<unknown> =>
  JSON.parse(JSON.stringify(await response.json())) as unknown;

describe('mswServerAdapter', () => {
  describe('request interception', () => {
    it('VALID: {GET handler} => intercepts and returns JSON response', async () => {
      mswServerAdapterProxy();

      const server = mswServerAdapter();

      server.use(http.get('http://test.local/api/items', () => HttpResponse.json([{ id: '1' }])));

      const response = await fetch('http://test.local/api/items');
      const body = await parseBody(response);

      expect(body).toStrictEqual([{ id: '1' }]);
    });

    it('VALID: {POST handler with status} => intercepts POST and returns custom status', async () => {
      mswServerAdapterProxy();

      const CREATED = 201;
      const server = mswServerAdapter();

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
      mswServerAdapterProxy();

      const server = mswServerAdapter();

      server.use(http.get('http://test.local/api/error', () => HttpResponse.error()));

      await expect(fetch('http://test.local/api/error')).rejects.toThrow(/fetch/iu);
    });
  });
});
