import { eslintRuleTesterAdapter } from './eslint-rule-tester-adapter';
import { RuleTester } from 'eslint';

interface GlobalWithRuleTester {
  RuleTester?: typeof RuleTester;
}

describe('eslintRuleTesterAdapter', () => {
  it('VALID: {} => returns RuleTester instance', () => {
    const result = eslintRuleTesterAdapter();

    expect(result).toBeInstanceOf(RuleTester);
  });

  it('VALID: {} => sets global RuleTester for test detection', () => {
    eslintRuleTesterAdapter();

    const globalWithRuleTester = globalThis as GlobalWithRuleTester;

    expect(globalWithRuleTester.RuleTester).toBe(RuleTester);
  });
});
