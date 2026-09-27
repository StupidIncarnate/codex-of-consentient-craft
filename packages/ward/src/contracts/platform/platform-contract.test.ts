import { platformContract } from './platform-contract';
import { PlatformStub } from './platform.stub';

describe('platformContract', () => {
  describe('valid inputs', () => {
    it('VALID: {value: "browser"} => parses successfully', () => {
      const result = platformContract.parse('browser');

      expect(result).toBe('browser');
    });

    it('VALID: {value: "node"} => parses successfully', () => {
      const result = platformContract.parse('node');

      expect(result).toBe('node');
    });
  });

  describe('invalid inputs', () => {
    it('INVALID: {value: "library"} => throws validation error', () => {
      expect(() => platformContract.parse('library')).toThrow(/Invalid option/u);
    });

    it('INVALID: {value: 1} => throws validation error', () => {
      expect(() => platformContract.parse(1 as never)).toThrow(/Expected 'browser' \| 'node'/u);
    });
  });

  describe('stub', () => {
    it('VALID: {default} => creates a browser platform', () => {
      const result = PlatformStub();

      expect(result).toBe('browser');
    });

    it('VALID: {value: "node"} => creates a node platform', () => {
      const result = PlatformStub({ value: 'node' });

      expect(result).toBe('node');
    });
  });
});
