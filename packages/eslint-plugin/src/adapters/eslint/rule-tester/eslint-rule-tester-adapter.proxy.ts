import type { RuleTester } from 'eslint';
import { eslintRuleTesterAdapter } from './eslint-rule-tester-adapter';

export const eslintRuleTesterAdapterProxy = (): {
  returnsRuleTester: () => RuleTester;
} => {
  // Create real RuleTester instance (no mocking - needs to actually run)
  const ruleTester = eslintRuleTesterAdapter();

  return {
    returnsRuleTester: (): RuleTester => ruleTester,
  };
};
