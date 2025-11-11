import { eslintEslintAdapter } from './eslint-eslint-adapter';
import { eslintEslintAdapterProxy } from './eslint-eslint-adapter.proxy';
import { EslintOptionsStub } from '../../../contracts/eslint-options/eslint-options.stub';
import { ESLint } from 'eslint';

describe('eslintEslintAdapter', () => {
  it('VALID: {options} => creates ESLint instance with options', () => {
    eslintEslintAdapterProxy();
    const options = EslintOptionsStub({ overrideConfigFile: true }) as ESLint.Options;

    const result = eslintEslintAdapter({ options });

    expect(result).toBeInstanceOf(ESLint);
  });
});
