import { eslintOptionsContract } from './eslint-options-contract';
import { EslintOptionsStub } from './eslint-options.stub';

describe('eslintOptionsContract', () => {
  describe('valid eslint options', () => {
    it('VALID: {overrideConfigFile: true} => parses successfully', () => {
      const options = EslintOptionsStub({ overrideConfigFile: true });

      const result = eslintOptionsContract.parse(options);

      expect(result).toStrictEqual({
        overrideConfigFile: true,
      });
    });
  });
});
