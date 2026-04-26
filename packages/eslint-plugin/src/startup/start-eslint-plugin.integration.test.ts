import { StartEslintPlugin } from './start-eslint-plugin';

describe('StartEslintPlugin', () => {
  describe('wiring to eslint-plugin flow', () => {
    it('VALID: {} => delegates to flow and returns plugin with rules and configs', () => {
      const plugin = StartEslintPlugin();

      expect(Object.keys(plugin.rules).sort()).toStrictEqual([
        'ban-adhoc-types',
        'ban-fetch-in-proxies',
        'ban-inline-helpers-in-test-scenarios',
        'ban-jest-mock-in-proxies',
        'ban-jest-mock-in-tests',
        'ban-negated-matchers',
        'ban-node-builtins-in-test-scenarios',
        'ban-not-to-throw',
        'ban-object-keys-in-expect',
        'ban-page-route-in-e2e',
        'ban-playwright-evaluate-for-styles',
        'ban-playwright-extract-then-assert',
        'ban-primitives',
        'ban-reflect-outside-guards',
        'ban-require-in-source',
        'ban-silent-catch',
        'ban-startup-branching',
        'ban-string-includes-in-expect',
        'ban-tautological-assertions',
        'ban-typeof-assertions',
        'ban-unanchored-to-match',
        'ban-unknown-payload-in-discriminated-union',
        'ban-wait-for-timeout',
        'ban-weak-asymmetric-matchers',
        'ban-weak-existence-matchers',
        'enforce-contract-usage-in-tests',
        'enforce-e2e-base-import',
        'enforce-file-metadata',
        'enforce-folder-return-types',
        'enforce-harness-patterns',
        'enforce-implementation-colocation',
        'enforce-import-dependencies',
        'enforce-jest-mocked-usage',
        'enforce-magic-arrays',
        'enforce-object-destructuring-params',
        'enforce-optional-guard-params',
        'enforce-project-structure',
        'enforce-proxy-child-creation',
        'enforce-proxy-patterns',
        'enforce-regex-usage',
        'enforce-stub-patterns',
        'enforce-stub-usage',
        'enforce-test-colocation',
        'enforce-test-creation-of-proxy',
        'enforce-test-name-prefix',
        'enforce-test-proxy-imports',
        'enforce-testid-queries',
        'forbid-non-exported-functions',
        'forbid-todo-skip',
        'forbid-type-reexport',
        'jest-mocked-must-import',
        'no-bare-process-cwd',
        'no-multiple-property-assertions',
        'no-mutable-state-in-proxy-factory',
        'require-contract-validation',
        'require-validation-on-untyped-property-access',
        'require-zod-on-primitives',
      ]);

      expect(Object.keys(plugin.configs).sort()).toStrictEqual([
        'dungeonmaster',
        'dungeonmasterTest',
      ]);
    });
  });
});
