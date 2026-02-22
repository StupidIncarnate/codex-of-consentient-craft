import { binCommandContract } from './bin-command-contract';
import { BinCommandStub } from './bin-command.stub';

describe('binCommandContract', () => {
  describe('valid', () => {
    it('VALID: {value: "eslint"} => parses bare binary name', () => {
      const result = binCommandContract.parse('eslint');

      expect(result).toBe('eslint');
    });

    it('VALID: {value: "/project/node_modules/.bin/eslint"} => parses absolute binary path', () => {
      const result = binCommandContract.parse('/project/node_modules/.bin/eslint');

      expect(result).toBe('/project/node_modules/.bin/eslint');
    });
  });

  describe('invalid', () => {
    it('INVALID: {value: ""} => rejects empty string', () => {
      expect(() => binCommandContract.parse('')).toThrow('too_small');
    });
  });

  describe('stub', () => {
    it('VALID: {default} => returns default BinCommand', () => {
      const result = BinCommandStub();

      expect(result).toBe('/project/node_modules/.bin/eslint');
    });
  });
});
