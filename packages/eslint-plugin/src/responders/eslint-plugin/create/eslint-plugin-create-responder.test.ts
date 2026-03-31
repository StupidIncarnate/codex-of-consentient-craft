import { EslintPluginCreateResponderProxy } from './eslint-plugin-create-responder.proxy';

describe('EslintPluginCreateResponder', () => {
  describe('rule initialization', () => {
    it('VALID: {} => returns plugin with all 52 rule names', () => {
      const proxy = EslintPluginCreateResponderProxy();
      const plugin = proxy.callResponder();

      expect(plugin.rules).toStrictEqual({
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
        'ban-weak-asymmetric-matchers': {
          meta: {
            type: 'problem',
            docs: {
              description:
                'Ban weak asymmetric matchers (expect.any(X), expect.objectContaining(), etc.) nested inside toStrictEqual() or toBe() arguments.',
            },
            messages: {
              bannedNestedAny:
                'expect.any({{type}}) nested in assertion proves nothing about shape. Assert the exact value instead.',
              bannedNestedAsymmetric:
                'expect.{{method}}() nested in assertion is a partial match that hides missing/extra keys. Assert the complete value instead.',
            },
            schema: [],
          },
          create: expect.any(Function),
        },
      });
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

      expect(plugin.configs).toStrictEqual({
        dungeonmaster: expect.any(Object),
        dungeonmasterTest: expect.any(Object),
      });
    });

    it('VALID: {} => returns dungeonmaster config with typescript, test, fileOverrides, and ruleEnforceOn', () => {
      const proxy = EslintPluginCreateResponderProxy();
      const plugin = proxy.callResponder();

      expect(plugin.configs.dungeonmaster).toStrictEqual({
        typescript: expect.any(Object),
        test: expect.any(Object),
        fileOverrides: expect.any(Array),
        ruleEnforceOn: expect.any(Object),
      });
    });

    it('VALID: {} => returns typescript config with plugins and rules', () => {
      const proxy = EslintPluginCreateResponderProxy();
      const plugin = proxy.callResponder();
      const { typescript } = plugin.configs.dungeonmaster;

      expect(typescript).toStrictEqual({
        plugins: expect.any(Object),
        rules: expect.any(Object),
      });
    });

    it('VALID: {} => returns test config with plugins and rules', () => {
      const proxy = EslintPluginCreateResponderProxy();
      const plugin = proxy.callResponder();
      const { test } = plugin.configs.dungeonmaster;

      expect(test).toStrictEqual({
        plugins: expect.any(Object),
        rules: expect.any(Object),
      });
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
