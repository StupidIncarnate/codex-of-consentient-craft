import { scriptNameContract } from './script-name-contract';
import { ScriptNameStub } from './script-name.stub';

describe('scriptNameContract', () => {
  describe('valid names', () => {
    it('VALID: {value: "test"} => parses successfully', () => {
      const name = ScriptNameStub({ value: 'test' });

      const result = scriptNameContract.parse(name);

      expect(result).toBe('test');
    });
  });

  describe('invalid names', () => {
    it('INVALID: {value: 123} => throws validation error', () => {
      expect(() => scriptNameContract.parse(123)).toThrow(/expected string/u);
    });
  });
});
