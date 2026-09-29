/**
 * PURPOSE: Harness for ESLint RuleTester with `parserOptions.project: true` - for rule brokers that call the TypeScript type checker (platform-globals-ban, enforce-folder-return-types). Use `ruleTesterHarness` for every rule that only reads the AST: `project: true` builds a real TypeScript program per test.
 *
 * USAGE:
 * const ruleTester = typedRuleTesterHarness();
 * ruleTester.run('my-typed-rule', myTypedRuleBroker(), {
 *   valid: [{ code: '...', filename: '/repo/packages/eslint-plugin/src/x.ts' }],
 *   invalid: [{ code: '...', filename: '/repo/packages/web/src/y.tsx', errors: [{ messageId: '...' }] }],
 * });
 * // filename must be a real path under a real tsconfig.json's `include` - `project: true` walks
 * // up from its directory on disk to find one, the same way the real linter does per file.
 */
import { RuleTester } from '#gateway/npm/eslint';
import type { Linter, Rule } from '#gateway/npm/eslint';
import * as tsParser from '#gateway/npm/typescript-eslint__parser';
import type { TSESLint } from '#gateway/npm/typescript-eslint__utils';
import { resolve } from '#gateway/node/path';

// `project: true`'s tsconfigRootDir defaults to `process.cwd()`, which under ward's per-package
// jest run is the PACKAGE directory, not the repo root - and typescript-eslint refuses to walk
// its tsconfig search above tsconfigRootDir. A typed rule's tests reference real files in OTHER
// packages (a browser-platform anchor, a gateway anchor), so the root must be the repo root:
// five levels up from this harness's own folder (typed-rule-tester/harnesses/test/eslint-plugin/packages/<root>).
const REPO_ROOT = resolve(__dirname, '../../../../..');

interface GlobalWithRuleTester {
  RuleTester?: typeof RuleTester;
}

export const typedRuleTesterHarness = (): {
  run: (name: string, rule: TSESLint.AnyRuleModule, tests: unknown) => void;
} => {
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
    run: (name: string, rule: TSESLint.AnyRuleModule, tests: unknown): void => {
      // Marks the run as a RuleTester test for @dungeonmaster/testing's assertion check;
      // RuleTester.run() creates its own assertions internally.
      const globalWithRuleTester = globalThis as GlobalWithRuleTester & typeof globalThis;
      globalWithRuleTester.RuleTester = RuleTester;

      ruleTester.run(
        name,
        rule as unknown as Rule.RuleModule,
        tests as Parameters<typeof ruleTester.run>[2],
      );
    },
  };
};
