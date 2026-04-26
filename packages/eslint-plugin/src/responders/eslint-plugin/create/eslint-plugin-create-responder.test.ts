import { EslintPluginCreateResponderProxy } from './eslint-plugin-create-responder.proxy';

describe('EslintPluginCreateResponder', () => {
  describe('rule initialization', () => {
    it('VALID: {} => returns plugin with all 57 rule names', () => {
      const proxy = EslintPluginCreateResponderProxy();
      const plugin = proxy.callResponder();

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
        'no-multiple-property-assertions',
        'no-mutable-state-in-proxy-factory',
        'require-contract-validation',
        'require-validation-on-untyped-property-access',
        'require-zod-on-primitives',
      ]);
    });

    it('VALID: {} => returns all rules with valid meta.type', () => {
      const proxy = EslintPluginCreateResponderProxy();
      const plugin = proxy.callResponder();
      const ruleTypes = Object.values(plugin.rules).map((rule) => rule.meta.type);

      expect(ruleTypes.every((type) => /^(?:problem|suggestion|layout)$/u.test(type))).toBe(true);
    });

    it('VALID: {} => returns all rules with meta.docs.description as string', () => {
      const proxy = EslintPluginCreateResponderProxy();
      const plugin = proxy.callResponder();
      const descriptions = Object.values(plugin.rules).map((rule) => rule.meta.docs.description);

      expect(descriptions.every((desc) => desc.length > 0)).toBe(true);
    });

    it('VALID: {} => returns all rules with create function', () => {
      const proxy = EslintPluginCreateResponderProxy();
      const plugin = proxy.callResponder();
      const createFunctions = Object.values(plugin.rules).map((rule) => rule.create);

      expect(createFunctions.every((fn) => typeof fn === 'function')).toBe(true);
    });

    it('VALID: {} => returns ban-primitives rule with complete structure', () => {
      const proxy = EslintPluginCreateResponderProxy();
      const plugin = proxy.callResponder();

      expect(plugin.rules['ban-primitives']).toStrictEqual({
        meta: {
          type: 'problem',
          docs: {
            description: 'Ban raw string and number types in favor of Zod contract types',
          },
          messages: {
            banPrimitive:
              'Raw {{typeName}} type is not allowed. Use the discover endpoint to search for existing contracts (e.g., {{suggestion}}). If none fits, create a new contract.',
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

  describe('config initialization', () => {
    it('VALID: {} => returns config with dungeonmaster and dungeonmasterTest namespaces', () => {
      const proxy = EslintPluginCreateResponderProxy();
      const plugin = proxy.callResponder();

      expect(Object.keys(plugin.configs).sort()).toStrictEqual([
        'dungeonmaster',
        'dungeonmasterTest',
      ]);
    });

    it('VALID: {} => returns dungeonmaster config with typescript, test, fileOverrides, and ruleEnforceOn', () => {
      const proxy = EslintPluginCreateResponderProxy();
      const plugin = proxy.callResponder();

      expect(Object.keys(plugin.configs.dungeonmaster).sort()).toStrictEqual([
        'fileOverrides',
        'ruleEnforceOn',
        'test',
        'typescript',
      ]);
    });

    it('VALID: {} => returns typescript config with plugins and rules', () => {
      const proxy = EslintPluginCreateResponderProxy();
      const plugin = proxy.callResponder();
      const { typescript } = plugin.configs.dungeonmaster;

      expect(Object.keys(typescript).sort()).toStrictEqual(['plugins', 'rules']);
    });

    it('VALID: {} => returns test config with plugins and rules', () => {
      const proxy = EslintPluginCreateResponderProxy();
      const plugin = proxy.callResponder();
      const { test } = plugin.configs.dungeonmaster;

      expect(Object.keys(test).sort()).toStrictEqual(['plugins', 'rules']);
    });

    it('VALID: {} => returns fileOverrides with 8 override configs', () => {
      const proxy = EslintPluginCreateResponderProxy();
      const plugin = proxy.callResponder();
      const { fileOverrides } = plugin.configs.dungeonmaster;

      expect(fileOverrides.map((o) => o.files)).toStrictEqual([
        ['**/*.proxy.ts', '**/*.proxy.tsx'],
        ['**/*.stub.ts', '**/*.stub.tsx'],
        ['**/*.integration.test.ts', '**/*.integration.test.tsx'],
        ['**/*.e2e.test.ts', '**/*.e2e.test.tsx'],
        ['**/*.e2e.test.ts', '**/*.integration.test.ts'],
        ['**/startup/start-*.ts'],
        ['**/*.spec.ts'],
        ['**/*.harness.ts'],
      ]);
    });

    it('VALID: {} => returns fileOverrides with proxy files override', () => {
      const proxy = EslintPluginCreateResponderProxy();
      const plugin = proxy.callResponder();
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
      const proxy = EslintPluginCreateResponderProxy();
      const plugin = proxy.callResponder();
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
      const proxy = EslintPluginCreateResponderProxy();
      const plugin = proxy.callResponder();
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
      const proxy = EslintPluginCreateResponderProxy();
      const plugin = proxy.callResponder();
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
      const proxy = EslintPluginCreateResponderProxy();
      const plugin = proxy.callResponder();
      const { fileOverrides } = plugin.configs.dungeonmaster;
      const [, , , , startupOverride] = fileOverrides;

      expect(startupOverride).toStrictEqual({
        files: ['**/*.e2e.test.ts', '**/*.integration.test.ts'],
        rules: {
          '@typescript-eslint/init-declarations': 'off',
          'jest/no-hooks': 'off',
        },
      });
    });

    it('VALID: {} => returns fileOverrides with startup start files override', () => {
      const proxy = EslintPluginCreateResponderProxy();
      const plugin = proxy.callResponder();
      const { fileOverrides } = plugin.configs.dungeonmaster;
      const [, , , , , startupStartOverride] = fileOverrides;

      expect(startupStartOverride).toStrictEqual({
        files: ['**/startup/start-*.ts'],
        ignores: ['**/*.test.ts'],
        rules: {
          '@typescript-eslint/no-unused-expressions': ['error', { allowShortCircuit: true }],
        },
      });
    });

    it('VALID: {} => returns typescript config with enforce-object-destructuring-params enabled', () => {
      const proxy = EslintPluginCreateResponderProxy();
      const plugin = proxy.callResponder();

      expect(
        plugin.configs.dungeonmaster.typescript.rules?.[
          '@dungeonmaster/enforce-object-destructuring-params'
        ],
      ).toBe('error');
    });

    it('VALID: {} => returns test config with no-unsafe-call disabled', () => {
      const proxy = EslintPluginCreateResponderProxy();
      const plugin = proxy.callResponder();

      expect(plugin.configs.dungeonmaster.test.rules?.['@typescript-eslint/no-unsafe-call']).toBe(
        'off',
      );
    });
  });
});
