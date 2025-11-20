import { cryptoRandomBytesAdapter } from './crypto-random-bytes-adapter';
import { cryptoRandomBytesAdapterProxy } from './crypto-random-bytes-adapter.proxy';

describe('cryptoRandomBytesAdapter', () => {
  describe('valid generation', () => {
    it('VALID: {length: 4} => returns 4 random bytes', () => {
      const proxy = cryptoRandomBytesAdapterProxy();
      const length = 4;
      const expectedBytes = Buffer.from('abcd');

      proxy.returns({ length, bytes: expectedBytes });

      const result = cryptoRandomBytesAdapter({ length });

      expect(result).toStrictEqual(expectedBytes);
    });

    it('VALID: {length: 16} => returns 16 random bytes', () => {
      const proxy = cryptoRandomBytesAdapterProxy();
      const length = 16;
      const expectedBytes = Buffer.from('0123456789abcdef');

      proxy.returns({ length, bytes: expectedBytes });

      const result = cryptoRandomBytesAdapter({ length });

      expect(result).toStrictEqual(expectedBytes);
    });
  });
});
