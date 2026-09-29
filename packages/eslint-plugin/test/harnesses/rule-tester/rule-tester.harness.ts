/**
 * PURPOSE: Harness for ESLint RuleTester - configures the TypeScript parser for rule integration tests and translates contract rule types to ESLint types.
 *
 * USAGE:
 * const ruleTester = ruleTesterHarness();
 * ruleTester.run('my-rule', myRuleBroker(), {
 *   valid: ['const foo = (): string => "bar"'],
 *   invalid: [{ code: 'const foo = () => "bar"', errors: [{ messageId: 'missingReturnType' }] }],
 * });
 * // Returns a RuleTester whose run method accepts a TSESLint rule module
 */
import { RuleTester } from '#gateway/npm/eslint';
import type { Linter, Rule } from '#gateway/npm/eslint';
import * as tsParser from '#gateway/npm/typescript-eslint__parser';
import type { TSESLint } from '#gateway/npm/typescript-eslint__utils';

interface GlobalWithRuleTester {
  RuleTester?: typeof RuleTester;
}

export const ruleTesterHarness = (): {
  run: (name: string, rule: TSESLint.AnyRuleModule, tests: unknown) => void;
} => {
  const tsParserAsLinterParser = tsParser as unknown as Linter.Parser;

  const ruleTester = new RuleTester({
    languageOptions: {
      parser: tsParserAsLinterParser,
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
    run: (name: string, rule: TSESLint.AnyRuleModule, tests: unknown): void => {
      // Marks the run as a RuleTester test for @dungeonmaster/testing's assertion check;
      // RuleTester.run() creates its own assertions internally.
      const globalWithRuleTester = globalThis as GlobalWithRuleTester & typeof globalThis;
      globalWithRuleTester.RuleTester = RuleTester;

      // Contract types are cast to ESLint types at this boundary
      ruleTester.run(
        name,
        rule as unknown as Rule.RuleModule,
        tests as Parameters<typeof ruleTester.run>[2],
      );
    },
  };
};
