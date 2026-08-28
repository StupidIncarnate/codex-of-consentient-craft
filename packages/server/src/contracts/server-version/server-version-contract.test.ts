import { serverVersionContract } from './server-version-contract';
import { ServerVersionStub } from './server-version.stub';

describe('serverVersionContract', () => {
  describe('valid versions', () => {
    it('VALID: {value: "0.1.0"} => parses successfully', () => {
      const result = ServerVersionStub({ value: '0.1.0' });

      expect(result).toBe('0.1.0');
    });
  });

  describe('invalid versions', () => {
    it('INVALID: {value: ""} => throws on empty string', () => {
      expect(() => serverVersionContract.parse('')).toThrow(/too_small/u);
    });
  });
});
