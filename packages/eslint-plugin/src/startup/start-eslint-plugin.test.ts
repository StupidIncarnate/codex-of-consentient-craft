import { startEslintPlugin } from './start-eslint-plugin';

describe('startEslintPlugin', () => {
  describe('initialize()', () => {
    it('VALID: => returns plugin with all rule names', () => {
      const plugin = startEslintPlugin();

      expect(Object.keys(plugin.rules)).toStrictEqual([
        'ban-adhoc-types',
        'ban-primitives',
        'ban-contract-in-tests',
        'ban-jest-mock-in-tests',
        'require-zod-on-primitives',
        'explicit-return-types',
        'enforce-project-structure',
        'enforce-import-dependencies',
        'enforce-jest-mocked-usage',
        'enforce-object-destructuring-params',
        'enforce-optional-guard-params',
        'enforce-stub-patterns',
        'enforce-proxy-child-creation',
        'enforce-proxy-patterns',
        'enforce-test-colocation',
        'enforce-test-creation-of-proxy',
        'enforce-test-proxy-imports',
        'enforce-implementation-colocation',
        'forbid-non-exported-functions',
        'jest-mocked-must-import',
        'no-mutable-state-in-proxy-factory',
        'require-contract-validation',
        'no-multiple-property-assertions',
      ]);
    });

    it('VALID: => returns ban-primitives rule with complete structure', () => {
      const plugin = startEslintPlugin();

      expect(plugin.rules['ban-primitives']).toStrictEqual({
        meta: {
          type: 'problem',
          docs: {
            description: 'Ban raw string and number types in favor of Zod contract types',
          },
          messages: {
            banPrimitive:
              'Raw {{typeName}} type is not allowed. Use Zod contract types like {{suggestion}} instead.',
          },
          schema: [],
        },
        create: expect.any(Function),
      });
    });

    it('VALID: => returns config with questmaestro name', () => {
      const plugin = startEslintPlugin();

      expect(Object.keys(plugin.configs)).toStrictEqual(['questmaestro']);
    });

    it('VALID: => returns questmaestro config with enforce-object-destructuring-params enabled', () => {
      const plugin = startEslintPlugin();

      expect(
        plugin.configs.questmaestro.typescript.rules?.[
          '@questmaestro/enforce-object-destructuring-params'
        ],
      ).toBe('error');
    });
  });
});
