import { eslintTypedRuleTesterAdapter } from './eslint-typed-rule-tester-adapter';

export const eslintTypedRuleTesterAdapterProxy = (): {
  returnsRuleTester: () => ReturnType<typeof eslintTypedRuleTesterAdapter>;
} => {
  // Create real RuleTester instance (no mocking - needs to actually run)
  const ruleTester = eslintTypedRuleTesterAdapter();

  return {
    returnsRuleTester: (): ReturnType<typeof eslintTypedRuleTesterAdapter> => ruleTester,
  };
};
