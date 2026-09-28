import { dmHttpTransportFailureTransformer } from './dm-http-transport-failure-transformer';

describe('dmHttpTransportFailureTransformer', () => {
  describe('a fetch rejection', () => {
    it('VALID: {cause: TypeError, url} => returns an Error carrying that url', () => {
      const cause = new TypeError('fetch failed');

      const result = dmHttpTransportFailureTransformer({
        cause,
        url: 'http://app.in-process/api/guilds',
      });

      expect({
        url: (result as unknown as Record<PropertyKey, unknown>).url,
        cause: result.cause,
        message: result.message,
      }).toStrictEqual({
        url: 'http://app.in-process/api/guilds',
        cause,
        message: 'TypeError: fetch failed',
      });
    });
  });

  describe('a plain thrown value', () => {
    it('VALID: {cause: a string, url} => returns an Error whose message is that string', () => {
      const result = dmHttpTransportFailureTransformer({
        cause: 'socket hang up',
        url: 'http://app.in-process/api/quests',
      });

      expect({
        url: (result as unknown as Record<PropertyKey, unknown>).url,
        message: result.message,
      }).toStrictEqual({
        url: 'http://app.in-process/api/quests',
        message: 'socket hang up',
      });
    });
  });
});
