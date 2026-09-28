import { platformCrossingResolveCacheKeyContract } from './platform-crossing-resolve-cache-key-contract';
import { PlatformCrossingResolveCacheKeyStub } from './platform-crossing-resolve-cache-key.stub';

describe('platformCrossingResolveCacheKeyContract', () => {
  describe('valid inputs', () => {
    it('VALID: {value: "/repo/entry.ts\\u0000./helper"} => parses successfully', () => {
      const result = platformCrossingResolveCacheKeyContract.parse(
        PlatformCrossingResolveCacheKeyStub(),
      );

      expect(result).toBe('/repo/entry.ts\u0000./helper');
    });
  });

  describe('invalid inputs', () => {
    it('INVALID: {value: ""} => throws validation error', () => {
      expect(() => platformCrossingResolveCacheKeyContract.parse('')).toThrow(/>=1/u);
    });
  });

  describe('stub', () => {
    it('VALID: {default} => creates a resolve cache key', () => {
      const result = PlatformCrossingResolveCacheKeyStub();

      expect(result).toBe('/repo/entry.ts\u0000./helper');
    });
  });
});
