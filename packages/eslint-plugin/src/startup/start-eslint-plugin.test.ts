import { StartEslintPlugin } from './start-eslint-plugin';

describe('StartEslintPlugin', () => {
  describe('initialize()', () => {
    it('VALID: => returns plugin with all rule names', () => {
      const plugin = StartEslintPlugin();

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
        'enforce-stub-usage',
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
      const plugin = StartEslintPlugin();

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
          schema: [
            {
              type: 'object',
              properties: {
                allowPrimitiveInputs: {
                  type: 'boolean',
                  description: 'Allow raw primitives in function parameters',
                },
                allowPrimitiveReturns: {
                  type: 'boolean',
                  description: 'Allow raw primitives in function return types',
                },
              },
              additionalProperties: false,
            },
          ],
        },
        create: expect.any(Function),
      });
    });

    it('VALID: => returns config with questmaestro name', () => {
      const plugin = StartEslintPlugin();

      expect(Object.keys(plugin.configs)).toStrictEqual(['questmaestro']);
    });

    it('VALID: => returns questmaestro config with enforce-object-destructuring-params enabled', () => {
      const plugin = StartEslintPlugin();

      expect(
        plugin.configs.questmaestro.typescript.rules?.[
          '@questmaestro/enforce-object-destructuring-params'
        ],
      ).toBe('error');
    });
  });
});
