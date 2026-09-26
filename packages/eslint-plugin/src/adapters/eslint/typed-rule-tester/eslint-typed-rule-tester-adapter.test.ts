import { RuleTester } from 'eslint';
import { eslintTypedRuleTesterAdapter } from './eslint-typed-rule-tester-adapter';
import { eslintTypedRuleTesterAdapterProxy } from './eslint-typed-rule-tester-adapter.proxy';

interface GlobalWithRuleTester {
  RuleTester?: typeof RuleTester;
}

describe('eslintTypedRuleTesterAdapter', () => {
  it('VALID: {} => returns RuleTester instance', () => {
    eslintTypedRuleTesterAdapterProxy();

    const result = eslintTypedRuleTesterAdapter();

    expect(result).toStrictEqual({
      run: expect.any(Function),
    });
  });

  it('VALID: {} => sets global RuleTester for test detection', () => {
    eslintTypedRuleTesterAdapterProxy();

    eslintTypedRuleTesterAdapter();

    const globalWithRuleTester = globalThis as GlobalWithRuleTester;

    expect(globalWithRuleTester.RuleTester).toBe(RuleTester);
  });
});
