import { cryptoHashAdapter } from './crypto-hash-adapter';
import { cryptoHashAdapterProxy } from './crypto-hash-adapter.proxy';
import { ContentTextStub } from '@dungeonmaster/shared/contracts';

// sha-256 of the empty string.
const EMPTY_DIGEST = 'e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855';
const JSON_DIGEST = '015abd7f5cc57a2dd94b7590f04ad8084273905ee33ec5cebeae62276a97f862';

describe('cryptoHashAdapter', () => {
  describe('hashing content', () => {
    it('VALID: {content: \'{"a":1}\'} => returns the sha256 hex digest of that exact string', () => {
      cryptoHashAdapterProxy();
      const content = ContentTextStub({ value: '{"a":1}' });

      const result = cryptoHashAdapter({ content });

      expect(result).toBe(JSON_DIGEST);
    });

    it('VALID: {same content, called twice} => returns the identical digest both times', () => {
      cryptoHashAdapterProxy();
      const content = ContentTextStub({ value: '{"a":1}' });

      const first = cryptoHashAdapter({ content });
      const second = cryptoHashAdapter({ content });

      expect(first).toBe(second);
    });
  });

  describe('empty content', () => {
    it('EMPTY: {content: ""} => returns the sha256 digest of no bytes', () => {
      cryptoHashAdapterProxy();
      const content = ContentTextStub({ value: '' });

      const result = cryptoHashAdapter({ content });

      expect(result).toBe(EMPTY_DIGEST);
    });
  });
});
