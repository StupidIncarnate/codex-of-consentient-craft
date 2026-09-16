import { urlPathContract } from './url-path-contract';
import type { UrlPathStub } from './url-path.stub';

type UrlPath = ReturnType<typeof UrlPathStub>;

describe('urlPathContract', () => {
  describe('valid paths', () => {
    it('VALID: {value: "/api/guilds"} => parses to itself', () => {
      const result: UrlPath = urlPathContract.parse('/api/guilds');

      expect(result).toBe('/api/guilds');
    });

    it('VALID: {value: "/"} => parses to itself', () => {
      const result: UrlPath = urlPathContract.parse('/');

      expect(result).toBe('/');
    });
  });

  describe('invalid paths', () => {
    it('INVALID: {value: "api/guilds"} => throws for a missing leading slash', () => {
      expect(() => urlPathContract.parse('api/guilds' as never)).toThrow(/must start with/u);
    });

    it('INVALID: {value: 42} => throws for a non-string', () => {
      expect(() => urlPathContract.parse(42 as never)).toThrow(/expected string/iu);
    });
  });
});
