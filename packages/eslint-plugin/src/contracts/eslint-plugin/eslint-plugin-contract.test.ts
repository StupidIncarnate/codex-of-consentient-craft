import { EslintPluginStub } from './eslint-plugin.stub';
import { eslintPluginContract } from './eslint-plugin-contract';

describe('eslintPluginContract', () => {
  it('VALID: {rules: {}} => returns plugin object', () => {
    eslintPluginContract.safeParse({});
    const result = EslintPluginStub({ rules: {} });

    expect(result).toStrictEqual({ rules: {} });
  });

  it('VALID: {rules: {}, configs: {}} => returns plugin object', () => {
    const result = EslintPluginStub({ rules: {}, configs: {} });

    expect(result).toStrictEqual({ rules: {}, configs: {} });
  });

  it('VALID: {rules: {}, configs: {}, processors: {}} => returns plugin object', () => {
    const result = EslintPluginStub({ rules: {}, configs: {}, processors: {} });

    expect(result).toStrictEqual({ rules: {}, configs: {}, processors: {} });
  });
});
