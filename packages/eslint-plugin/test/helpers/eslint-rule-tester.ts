import { RuleTester } from 'eslint';
import type { Linter } from 'eslint';

/**
 * Creates a configured RuleTester for TypeScript ESLint rule integration tests.
 *
 * This harness:
 * - Configures @typescript-eslint/parser for TypeScript support
 * - Marks tests as RuleTester tests for @questmaestro/testing assertion checks
 *
 * @returns Configured RuleTester instance ready for use
 *
 * @example
 * ```typescript
 * import { createEslintRuleTester } from '../../../test/helpers/eslint-rule-tester';
 * import { myRuleBroker } from './my-rule-broker';
 *
 * const ruleTester = createEslintRuleTester();
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

export const createEslintRuleTester = (): RuleTester => {
  // Mark as RuleTester test for @questmaestro/testing assertion check
  // RuleTester.run() creates its own assertions internally
  const globalWithRuleTester = globalThis as GlobalWithRuleTester & typeof globalThis;
  globalWithRuleTester.RuleTester = RuleTester;

  const tsParser = require('@typescript-eslint/parser') as Linter.Parser;

  return new RuleTester({
    languageOptions: {
      parser: tsParser,
      parserOptions: {
        ecmaVersion: 2020,
        sourceType: 'module',
      },
    },
  });
};
