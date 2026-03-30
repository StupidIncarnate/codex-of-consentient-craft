import { StartEslintPlugin } from './start-eslint-plugin';

describe('StartEslintPlugin', () => {
  describe('wiring to eslint-plugin flow', () => {
    it('VALID: {} => delegates to flow and returns plugin with rules and configs', () => {
      const plugin = StartEslintPlugin();

      expect(plugin).toStrictEqual({
        rules: {
          'ban-adhoc-types': expect.any(Object),
          'ban-primitives': expect.any(Object),
          'enforce-contract-usage-in-tests': expect.any(Object),
          'ban-jest-mock-in-tests': expect.any(Object),
          'require-zod-on-primitives': expect.any(Object),
          'explicit-return-types': expect.any(Object),
          'enforce-project-structure': expect.any(Object),
          'enforce-import-dependencies': expect.any(Object),
          'enforce-jest-mocked-usage': expect.any(Object),
          'enforce-magic-arrays': expect.any(Object),
          'enforce-object-destructuring-params': expect.any(Object),
          'enforce-optional-guard-params': expect.any(Object),
          'enforce-stub-patterns': expect.any(Object),
          'enforce-stub-usage': expect.any(Object),
          'enforce-proxy-child-creation': expect.any(Object),
          'enforce-proxy-patterns': expect.any(Object),
          'enforce-test-colocation': expect.any(Object),
          'enforce-test-creation-of-proxy': expect.any(Object),
          'enforce-test-proxy-imports': expect.any(Object),
          'enforce-implementation-colocation': expect.any(Object),
          'forbid-non-exported-functions': expect.any(Object),
          'forbid-type-reexport': expect.any(Object),
          'jest-mocked-must-import': expect.any(Object),
          'no-mutable-state-in-proxy-factory': expect.any(Object),
          'require-contract-validation': expect.any(Object),
          'no-multiple-property-assertions': expect.any(Object),
          'forbid-todo-skip': expect.any(Object),
          'enforce-regex-usage': expect.any(Object),
          'enforce-file-metadata': expect.any(Object),
          'ban-fetch-in-proxies': expect.any(Object),
          'ban-startup-branching': expect.any(Object),
          'ban-jest-mock-in-proxies': expect.any(Object),
          'enforce-harness-patterns': expect.any(Object),
          'ban-node-builtins-in-test-scenarios': expect.any(Object),
          'ban-inline-helpers-in-test-scenarios': expect.any(Object),
          'ban-silent-catch': expect.any(Object),
          'ban-wait-for-timeout': expect.any(Object),
          'ban-page-route-in-e2e': expect.any(Object),
          'enforce-e2e-base-import': expect.any(Object),
          'ban-not-to-throw': expect.any(Object),
          'ban-weak-existence-matchers': expect.any(Object),
          'ban-typeof-assertions': expect.any(Object),
          'enforce-test-name-prefix': expect.any(Object),
          'ban-unanchored-to-match': expect.any(Object),
          'enforce-testid-queries': expect.any(Object),
          'ban-playwright-evaluate-for-styles': expect.any(Object),
          'ban-playwright-extract-then-assert': expect.any(Object),
          'ban-negated-matchers': expect.any(Object),
          'ban-tautological-assertions': expect.any(Object),
          'ban-object-keys-in-expect': expect.any(Object),
          'ban-string-includes-in-expect': expect.any(Object),
        },
        configs: {
          dungeonmaster: expect.any(Object),
          dungeonmasterTest: expect.any(Object),
        },
      });
    });
  });
});
