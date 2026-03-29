import { devServerUrlContract } from './dev-server-url-contract';
import { DevServerUrlStub } from './dev-server-url.stub';

describe('devServerUrlContract', () => {
  describe('valid values', () => {
    it('VALID: {http URL} => parses successfully', () => {
      const value = DevServerUrlStub({ value: 'http://localhost:3000' });

      const result = devServerUrlContract.parse(value);

      expect(result).toBe('http://localhost:3000');
    });

    it('VALID: {URL with path} => parses successfully', () => {
      const value = DevServerUrlStub({ value: 'http://localhost:3000/app' });

      const result = devServerUrlContract.parse(value);

      expect(result).toBe('http://localhost:3000/app');
    });
  });

  describe('invalid values', () => {
    it('INVALID: {non-URL string} => throws validation error', () => {
      expect(() => {
        devServerUrlContract.parse('not-a-url');
      }).toThrow(/invalid_string/u);
    });
  });
});
