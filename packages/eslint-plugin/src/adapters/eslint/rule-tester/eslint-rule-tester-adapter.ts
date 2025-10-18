import { RuleTester } from 'eslint';
import type { Linter, Rule } from 'eslint';
import type { EslintRule } from '../../../contracts/eslint-rule/eslint-rule-contract';
import { eslintRuleNameContract } from '../../../contracts/eslint-rule-name/eslint-rule-name-contract';
import type { EslintRuleName } from '../../../contracts/eslint-rule-name/eslint-rule-name-contract';

/**
 * Adapter for ESLint RuleTester - configures TypeScript parser for rule integration tests.
 *
 * This adapter:
 * - Configures @typescript-eslint/parser for TypeScript support
 * - Marks tests as RuleTester tests for @questmaestro/testing assertion checks
 * - Translates EslintRule contract types to ESLint Rule.RuleModule types
 * - Accepts either plain string or branded EslintRuleName for rule name
 *
 * @returns Configured RuleTester instance with run method that accepts EslintRule
 *
 * @example
 * ```typescript
 * import { eslintRuleTesterAdapter } from '../../../adapters/eslint/rule-tester/eslint-rule-tester-adapter';
 * import { myRuleBroker } from './my-rule-broker';
 *
 * const ruleTester = eslintRuleTesterAdapter();
 *
 * ruleTester.run('my-rule', myRuleBroker(), {
 *   valid: ['const foo = (): string => "bar"'],
 *   invalid: [{
 *     code: 'const foo = () => "bar"',
 *     errors: [{ messageId: 'missingReturnType' }],
 *   }],
 * });
 * ```
 */
interface GlobalWithRuleTester {
  RuleTester?: typeof RuleTester;
}

interface RuleTesterWithContractSupport {
  run: (name: string | EslintRuleName, rule: EslintRule, tests: unknown) => void;
}

export const eslintRuleTesterAdapter = (): RuleTesterWithContractSupport => {
  // Mark as RuleTester test for @questmaestro/testing assertion check
  // RuleTester.run() creates its own assertions internally
  const globalWithRuleTester = globalThis as GlobalWithRuleTester & typeof globalThis;
  globalWithRuleTester.RuleTester = RuleTester;

  // This is required cause of some weird circular dependency issues
  const tsParser = require('@typescript-eslint/parser') as Linter.Parser;

  const ruleTester = new RuleTester({
    languageOptions: {
      parser: tsParser,
      parserOptions: {
        ecmaVersion: 2020,
        sourceType: 'module',
        ecmaFeatures: {
          jsx: true,
        },
      },
    },
  });

  return {
    run: (name: string | EslintRuleName, rule: EslintRule, tests: unknown): void => {
      // Parse string to branded type, or pass through if already branded
      const ruleName = eslintRuleNameContract.parse(name);

      // Cast contract types to ESLint types - adapter translates at I/O boundary
      ruleTester.run(
        String(ruleName),
        rule as unknown as Rule.RuleModule,
        tests as Parameters<typeof ruleTester.run>[2],
      );
    },
  };
};
