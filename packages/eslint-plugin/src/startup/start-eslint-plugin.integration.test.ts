import { StartEslintPlugin } from './start-eslint-plugin';

describe('StartEslintPlugin', () => {
  describe('with default initialization', () => {
    it('VALID: {} => returns plugin with all 27 rule names', () => {
      const plugin = StartEslintPlugin();

      expect(Object.keys(plugin.rules)).toStrictEqual([
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
      ]);
    });

    it('VALID: {} => returns all rules with valid meta.type', () => {
      const plugin = StartEslintPlugin();
      const ruleTypes = Object.values(plugin.rules).map((rule) => rule.meta.type);

      expect(ruleTypes.every((type) => /^(?:problem|suggestion|layout)$/u.test(type))).toBe(true);
    });

    it('VALID: {} => returns all rules with meta.docs.description as string', () => {
      const plugin = StartEslintPlugin();
      const descriptions = Object.values(plugin.rules).map((rule) => rule.meta.docs.description);

      expect(descriptions.every((desc) => typeof desc === 'string')).toBe(true);
    });

    it('VALID: {} => returns all rules with create function', () => {
      const plugin = StartEslintPlugin();
      const createFunctions = Object.values(plugin.rules).map((rule) => typeof rule.create);

      expect(createFunctions.every((type) => type === 'function')).toBe(true);
    });

    it('VALID: {} => returns ban-primitives rule with complete structure', () => {
      const plugin = StartEslintPlugin();

      expect(plugin.rules['ban-primitives']).toStrictEqual({
        meta: {
          type: 'problem',
          docs: {
            description: 'Ban raw string and number types in favor of Zod contract types',
          },
          messages: {
            banPrimitive:
              'Raw {{typeName}} type is not allowed. Use mcp__dungeonmaster__discover to search for existing contracts (e.g., {{suggestion}}). If none fits, create a new contract.',
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
  });

  describe('with config initialization', () => {
    it('VALID: {} => returns config with dungeonmaster and dungeonmasterTest namespaces', () => {
      const plugin = StartEslintPlugin();

      expect(Object.keys(plugin.configs)).toStrictEqual(['dungeonmaster', 'dungeonmasterTest']);
    });

    it('VALID: {} => returns dungeonmaster config with typescript, test, fileOverrides, and ruleEnforceOn', () => {
      const plugin = StartEslintPlugin();

      expect(Object.keys(plugin.configs.dungeonmaster)).toStrictEqual([
        'typescript',
        'test',
        'fileOverrides',
        'ruleEnforceOn',
      ]);
    });

    it('VALID: {} => returns typescript config with plugins and rules', () => {
      const plugin = StartEslintPlugin();
      const { typescript } = plugin.configs.dungeonmaster;

      expect(Object.keys(typescript)).toStrictEqual(['plugins', 'rules']);
      expect(typeof typescript.plugins).toBe('object');
      expect(typeof typescript.rules).toBe('object');
    });

    it('VALID: {} => returns test config with plugins and rules', () => {
      const plugin = StartEslintPlugin();
      const { test } = plugin.configs.dungeonmaster;

      expect(Object.keys(test)).toStrictEqual(['plugins', 'rules']);
      expect(typeof test.plugins).toBe('object');
      expect(typeof test.rules).toBe('object');
    });

    it('VALID: {} => returns fileOverrides with 5 override configs', () => {
      const plugin = StartEslintPlugin();
      const { fileOverrides } = plugin.configs.dungeonmaster;

      expect(fileOverrides).toHaveLength(5);
    });

    it('VALID: {} => returns fileOverrides with proxy files override', () => {
      const plugin = StartEslintPlugin();
      const { fileOverrides } = plugin.configs.dungeonmaster;
      const [proxyOverride] = fileOverrides;

      expect(proxyOverride).toStrictEqual({
        files: ['**/*.proxy.ts', '**/*.proxy.tsx'],
        rules: {
          '@typescript-eslint/no-unsafe-type-assertion': 'off',
        },
      });
    });

    it('VALID: {} => returns fileOverrides with stub files override', () => {
      const plugin = StartEslintPlugin();
      const { fileOverrides } = plugin.configs.dungeonmaster;
      const [, stubOverride] = fileOverrides;

      expect(stubOverride).toStrictEqual({
        files: ['**/*.stub.ts', '**/*.stub.tsx'],
        rules: {
          '@typescript-eslint/no-magic-numbers': 'off',
        },
      });
    });

    it('VALID: {} => returns fileOverrides with integration test override', () => {
      const plugin = StartEslintPlugin();
      const { fileOverrides } = plugin.configs.dungeonmaster;
      const [, , integrationOverride] = fileOverrides;

      expect(integrationOverride).toStrictEqual({
        files: ['**/*.integration.test.ts', '**/*.integration.test.tsx'],
        rules: {
          'jest/max-expects': 'off',
        },
      });
    });

    it('VALID: {} => returns fileOverrides with e2e test override', () => {
      const plugin = StartEslintPlugin();
      const { fileOverrides } = plugin.configs.dungeonmaster;
      const [, , , e2eOverride] = fileOverrides;

      expect(e2eOverride).toStrictEqual({
        files: ['**/*.e2e.test.ts', '**/*.e2e.test.tsx'],
        rules: {
          'jest/max-expects': 'off',
          '@dungeonmaster/enforce-test-creation-of-proxy': 'off',
          '@dungeonmaster/enforce-test-colocation': 'off',
          '@dungeonmaster/require-contract-validation': 'off',
        },
      });
    });

    it('VALID: {} => returns fileOverrides with startup integration test override', () => {
      const plugin = StartEslintPlugin();
      const { fileOverrides } = plugin.configs.dungeonmaster;
      const [, , , , startupOverride] = fileOverrides;

      expect(startupOverride).toStrictEqual({
        files: ['**/startup/*.e2e.test.ts', '**/startup/*.integration.test.ts'],
        rules: {
          'jest/no-hooks': 'off',
        },
      });
    });

    it('VALID: {} => returns typescript config with enforce-object-destructuring-params enabled', () => {
      const plugin = StartEslintPlugin();

      expect(
        plugin.configs.dungeonmaster.typescript.rules?.[
          '@dungeonmaster/enforce-object-destructuring-params'
        ],
      ).toBe('error');
    });

    it('VALID: {} => returns test config with no-unsafe-call disabled', () => {
      const plugin = StartEslintPlugin();

      expect(plugin.configs.dungeonmaster.test.rules?.['@typescript-eslint/no-unsafe-call']).toBe(
        'off',
      );
    });
  });
});
