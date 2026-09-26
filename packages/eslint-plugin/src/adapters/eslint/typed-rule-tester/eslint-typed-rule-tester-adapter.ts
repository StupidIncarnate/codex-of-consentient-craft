/**
 * PURPOSE: Configures ESLint's RuleTester with `parserOptions.project: true`, mirroring
 * `eslint.config.js`'s own typed-linting block, for rule brokers that call the type checker
 * (platform-globals-ban). `eslintRuleTesterAdapter` stays untyped for every rule that only ever
 * needs the AST — adding `project: true` there would make EVERY rule broker's RuleTester build a
 * real TypeScript program per test, for rules that never look at one.
 *
 * USAGE:
 * const ruleTester = eslintTypedRuleTesterAdapter();
 * ruleTester.run('my-typed-rule', myTypedRuleBroker(), {
 *   valid: [{ code: '...', filename: '/repo/packages/eslint-plugin/src/x.ts' }],
 *   invalid: [{ code: '...', filename: '/repo/packages/web/src/y.tsx', errors: [{ messageId: '...' }] }],
 * });
 * // filename must be a real path under a real tsconfig.json's `include` — `project: true` walks
 * // up from its directory on disk to find one, the same way the real linter does per file.
 */
import { RuleTester } from 'eslint';
import type { Linter, Rule } from 'eslint';
import * as tsParser from '@typescript-eslint/parser';
import { resolve } from 'path';
import type { EslintRule } from '../../../contracts/eslint-rule/eslint-rule-contract';
import { eslintRuleNameContract } from '../../../contracts/eslint-rule-name/eslint-rule-name-contract';
import type { EslintRuleName } from '../../../contracts/eslint-rule-name/eslint-rule-name-contract';

// `project: true`'s tsconfigRootDir defaults to `process.cwd()`, which under ward's per-package
// jest run is the PACKAGE directory, not the repo root — and typescript-eslint refuses to walk
// its tsconfig search above tsconfigRootDir. A typed rule's tests reference real files in OTHER
// packages (a browser-platform anchor, a gateway anchor), so the root must be the repo root:
// six levels up from this adapter's own folder (typed-rule-tester/eslint/adapters/src/eslint-plugin/packages/<root>).
const REPO_ROOT = resolve(__dirname, '../../../../../..');

interface GlobalWithRuleTester {
  RuleTester?: typeof RuleTester;
}

interface RuleTesterWithContractSupport {
  run: (name: string | EslintRuleName, rule: EslintRule, tests: unknown) => void;
}

export const eslintTypedRuleTesterAdapter = (): RuleTesterWithContractSupport => {
  // Mark as RuleTester test for @dungeonmaster/testing assertion check
  const globalWithRuleTester = globalThis as GlobalWithRuleTester & typeof globalThis;
  globalWithRuleTester.RuleTester = RuleTester;

  const tsParserAsLinterParser = tsParser as unknown as Linter.Parser;

  const ruleTester = new RuleTester({
    languageOptions: {
      parser: tsParserAsLinterParser,
      parserOptions: {
        ecmaVersion: 2020,
        sourceType: 'module',
        ecmaFeatures: { jsx: true },
        project: true,
        tsconfigRootDir: REPO_ROOT,
      },
    },
  });

  return {
    run: (name: string | EslintRuleName, rule: EslintRule, tests: unknown): void => {
      const ruleName = eslintRuleNameContract.parse(name);
      ruleTester.run(
        String(ruleName),
        rule as unknown as Rule.RuleModule,
        tests as Parameters<typeof ruleTester.run>[2],
      );
    },
  };
};
