import { ContentTextStub } from '@dungeonmaster/shared/contracts';

import { fetchJsonAdapter } from './fetch-json-adapter';
import { fetchJsonAdapterProxy } from './fetch-json-adapter.proxy';

const URL_TEXT = 'http://dungeonmaster.localhost:34172/api/guilds';

describe('fetchJsonAdapter', () => {
  describe('successful requests', () => {
    it('VALID: {POST with a body} => returns the parsed JSON and sends the exact request', async () => {
      const proxy = fetchJsonAdapterProxy();
      proxy.answers({
        url: URL_TEXT,
        method: 'POST',
        body: { id: 'g-1', urlSlug: 'siege-guild' },
      });

      const result = await fetchJsonAdapter({
        url: ContentTextStub({ value: URL_TEXT }),
        method: ContentTextStub({ value: 'POST' }),
        body: { name: 'Siege Guild', path: '/tmp/x' },
      });

      expect(result).toStrictEqual({ id: 'g-1', urlSlug: 'siege-guild' });
      expect(proxy.requestsMatching({ url: URL_TEXT, method: 'POST' })).toStrictEqual([
        [
          URL_TEXT,
          {
            method: 'POST',
            headers: { Accept: 'application/json', 'Content-Type': 'application/json' },
            body: '{"name":"Siege Guild","path":"/tmp/x"}',
          },
        ],
      ]);
    });

    it('VALID: {GET with no body} => omits the body key entirely', async () => {
      const proxy = fetchJsonAdapterProxy();
      proxy.answers({ url: URL_TEXT, method: 'GET', body: [] });

      const result = await fetchJsonAdapter({
        url: ContentTextStub({ value: URL_TEXT }),
        method: ContentTextStub({ value: 'GET' }),
      });

      expect(result).toStrictEqual([]);
      expect(proxy.requestsMatching({ url: URL_TEXT, method: 'GET' })).toStrictEqual([
        [
          URL_TEXT,
          {
            method: 'GET',
            headers: { Accept: 'application/json', 'Content-Type': 'application/json' },
          },
        ],
      ]);
    });
  });

  describe('refused requests', () => {
    it('ERROR: {400 with a body} => throws naming method, url, status and body', async () => {
      const proxy = fetchJsonAdapterProxy();
      proxy.refuses({
        url: URL_TEXT,
        method: 'PATCH',
        status: 400,
        body: 'Invalid status transition: created -> in_progress',
      });

      await expect(
        fetchJsonAdapter({
          url: ContentTextStub({ value: URL_TEXT }),
          method: ContentTextStub({ value: 'PATCH' }),
          body: {},
        }),
      ).rejects.toThrow(
        `PATCH ${URL_TEXT} failed with status 400: Invalid status transition: created -> in_progress`,
      );
    });

    it('ERROR: {200 with a non-JSON body} => throws naming the body', async () => {
      const proxy = fetchJsonAdapterProxy();
      proxy.answersNonJson({ url: URL_TEXT, method: 'GET', body: '<html>nope</html>' });

      await expect(
        fetchJsonAdapter({
          url: ContentTextStub({ value: URL_TEXT }),
          method: ContentTextStub({ value: 'GET' }),
        }),
      ).rejects.toThrow(
        `GET ${URL_TEXT} answered 200 with a body that is not JSON: <html>nope</html>`,
      );
    });
  });
});
