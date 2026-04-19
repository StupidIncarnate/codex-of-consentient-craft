import { eslintRuleTesterAdapter } from './eslint-rule-tester-adapter';

export const eslintRuleTesterAdapterProxy = (): {
  returnsRuleTester: () => ReturnType<typeof eslintRuleTesterAdapter>;
} => {
  // Create real RuleTester instance (no mocking - needs to actually run)
  const ruleTester = eslintRuleTesterAdapter();

  return {
    returnsRuleTester: (): ReturnType<typeof eslintRuleTesterAdapter> => ruleTester,
  };
};
