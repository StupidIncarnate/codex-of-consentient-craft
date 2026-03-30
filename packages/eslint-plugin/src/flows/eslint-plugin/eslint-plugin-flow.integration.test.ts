import { EslintPluginFlow } from './eslint-plugin-flow';

describe('EslintPluginFlow', () => {
  describe('delegation to responder', () => {
    it('VALID: {} => delegates to responder and returns plugin with rules and configs', () => {
      const plugin = EslintPluginFlow();

      const ruleNames = Object.keys(plugin.rules);

      expect(ruleNames).toStrictEqual([
        'ban-adhoc-types',
        'ban-primitives',
        'enforce-contract-usage-in-tests',
        'ban-jest-mock-in-tests',
        'require-zod-on-primitives',
        'explicit-return-types',
        'enforce-project-structure',
        'enforce-import-dependencies',
        'enforce-jest-mocked-usage',
        'enforce-magic-arrays',
        'enforce-object-destructuring-params',
        'enforce-optional-guard-params',
        'enforce-stub-patterns',
        'enforce-stub-usage',
        'enforce-proxy-child-creation',
        'enforce-proxy-patterns',
        'enforce-test-colocation',
        'enforce-test-creation-of-proxy',
        'enforce-test-proxy-imports',
        'enforce-implementation-colocation',
        'forbid-non-exported-functions',
        'forbid-type-reexport',
        'jest-mocked-must-import',
        'no-mutable-state-in-proxy-factory',
        'require-contract-validation',
        'no-multiple-property-assertions',
        'forbid-todo-skip',
        'enforce-regex-usage',
        'enforce-file-metadata',
        'ban-fetch-in-proxies',
        'ban-startup-branching',
        'ban-jest-mock-in-proxies',
        'enforce-harness-patterns',
        'ban-node-builtins-in-test-scenarios',
        'ban-inline-helpers-in-test-scenarios',
        'ban-silent-catch',
        'ban-wait-for-timeout',
        'ban-page-route-in-e2e',
        'enforce-e2e-base-import',
        'ban-not-to-throw',
        'ban-weak-existence-matchers',
        'ban-typeof-assertions',
        'enforce-test-name-prefix',
        'ban-unanchored-to-match',
        'enforce-testid-queries',
        'ban-playwright-evaluate-for-styles',
        'ban-playwright-extract-then-assert',
        'ban-negated-matchers',
        'ban-tautological-assertions',
        'ban-object-keys-in-expect',
        'ban-string-includes-in-expect',
      ]);

      const configNames = Object.keys(plugin.configs);

      expect(configNames).toStrictEqual(['dungeonmaster', 'dungeonmasterTest']);
    });
  });
});
