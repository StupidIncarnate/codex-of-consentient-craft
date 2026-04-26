import { toolingSmoketestRunBodyContract } from './tooling-smoketest-run-body-contract';
import { ToolingSmoketestRunBodyStub } from './tooling-smoketest-run-body.stub';

describe('toolingSmoketestRunBodyContract', () => {
  describe('valid inputs', () => {
    it('VALID: {suite: "mcp"} => parses successfully', () => {
      const result = ToolingSmoketestRunBodyStub({ suite: 'mcp' });

      expect(result.suite).toBe('mcp');
    });
  });

  describe('invalid inputs', () => {
    it('INVALID: {suite: "bogus"} => throws validation error', () => {
      expect(() => {
        toolingSmoketestRunBodyContract.parse({ suite: 'bogus' });
      }).toThrow(/Invalid enum value/u);
    });
  });
});
