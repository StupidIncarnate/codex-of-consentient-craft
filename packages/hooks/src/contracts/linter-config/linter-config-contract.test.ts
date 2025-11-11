import { linterConfigContract } from './linter-config-contract';
import { LinterConfigStub } from './linter-config.stub';

describe('linterConfigContract', () => {
  describe('valid linter config', () => {
    it('VALID: {rules} => parses successfully', () => {
      const config = LinterConfigStub({
        rules: { 'no-console': 'error' },
      });

      const result = linterConfigContract.parse(config);

      expect(result).toStrictEqual({
        rules: { 'no-console': 'error' },
      });
    });

    it('VALID: {} => parses with empty config', () => {
      const config = LinterConfigStub({});

      const result = linterConfigContract.parse(config);

      expect(result).toStrictEqual({
        rules: { 'no-console': 'error' },
      });
    });
  });
});
