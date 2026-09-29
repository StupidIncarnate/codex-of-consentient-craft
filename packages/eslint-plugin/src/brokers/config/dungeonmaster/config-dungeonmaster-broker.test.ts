import { configDungeonmasterBroker } from './config-dungeonmaster-broker';
import { configDungeonmasterBrokerProxy } from './config-dungeonmaster-broker.proxy';
import { GatewayLintConfigStub } from '@dungeonmaster/shared/contracts/gateway-lint-config/gateway-lint-config.stub';
import { EslintRuleNameStub } from '../../../contracts/eslint-rule-name/eslint-rule-name.stub';
import typescriptEslintPlugin from '#gateway/npm/typescript-eslint__eslint-plugin';
import eslintPluginJest from '#gateway/npm/eslint-plugin-jest';
import * as eslintPluginEslintComments from '#gateway/npm/eslint-plugin-eslint-comments';

describe('configDungeonmasterBroker', () => {
  describe('return value structure', () => {
    it('VALID: {} => returns object with typescript, test, gateway, fileOverrides, and ruleEnforceOn keys', () => {
      configDungeonmasterBrokerProxy();

      const result = configDungeonmasterBroker();

      const keys = Object.keys(result).sort();

      expect(keys).toStrictEqual([
        'fileOverrides',
        'gateway',
        'ruleEnforceOn',
        'test',
        'typescript',
      ]);
    });

    it('VALID: {} => typescript config registers the real @typescript-eslint plugin object', () => {
      configDungeonmasterBrokerProxy();

      const { typescript } = configDungeonmasterBroker();

      expect((typescript.plugins as Record<PropertyKey, unknown>)['@typescript-eslint']).toBe(
        typescriptEslintPlugin,
      );
    });

    it('VALID: {} => typescript config registers the real eslint-comments plugin object', () => {
      configDungeonmasterBrokerProxy();

      const { typescript } = configDungeonmasterBroker();

      expect((typescript.plugins as Record<PropertyKey, unknown>)['eslint-comments']).toBe(
        eslintPluginEslintComments,
      );
    });

    it('VALID: {} => typescript config contains enforce-contract-usage-in-tests rule', () => {
      configDungeonmasterBrokerProxy();

      const { typescript } = configDungeonmasterBroker();

      expect(
        typescript.rules?.[
          EslintRuleNameStub({ value: '@dungeonmaster/enforce-contract-usage-in-tests' })
        ],
      ).toBe('error');
    });

    it('VALID: {} => typescript config contains enforce-object-destructuring-params rule', () => {
      configDungeonmasterBrokerProxy();

      const { typescript } = configDungeonmasterBroker();

      expect(
        typescript.rules?.[
          EslintRuleNameStub({ value: '@dungeonmaster/enforce-object-destructuring-params' })
        ],
      ).toBe('error');
    });

    it('VALID: {} => fileOverrides includes stub file config', () => {
      configDungeonmasterBrokerProxy();

      const { fileOverrides } = configDungeonmasterBroker();
      const stubConfig = fileOverrides.find((config) => {
        return Boolean(
          config.files?.some((file) => {
            return file === '**/*.stub.ts';
          }),
        );
      });

      expect(stubConfig?.files).toStrictEqual(['**/*.stub.ts', '**/*.stub.tsx']);
    });

    it('VALID: {} => stub file config disables magic numbers', () => {
      configDungeonmasterBrokerProxy();

      const { fileOverrides } = configDungeonmasterBroker();
      const stubConfig = fileOverrides.find((config) => {
        return Boolean(
          config.files?.some((file) => {
            return file === '**/*.stub.ts';
          }),
        );
      });

      expect(
        stubConfig?.rules?.[EslintRuleNameStub({ value: '@typescript-eslint/no-magic-numbers' })],
      ).toBe('off');
    });

    it('VALID: {} => typescript config includes no-explicit-any rule', () => {
      configDungeonmasterBrokerProxy();

      const { typescript } = configDungeonmasterBroker();

      expect(
        typescript.rules?.[EslintRuleNameStub({ value: '@typescript-eslint/no-explicit-any' })],
      ).toBe('error');
    });

    it('VALID: {} => typescript config includes explicit-function-return-type rule', () => {
      configDungeonmasterBrokerProxy();

      const { typescript } = configDungeonmasterBroker();

      expect(
        typescript.rules?.[
          EslintRuleNameStub({ value: '@typescript-eslint/explicit-function-return-type' })
        ],
      ).toStrictEqual(['error', { allowExpressions: true }]);
    });

    it('VALID: {} => typescript config includes eslint-comments no-unlimited-disable rule', () => {
      configDungeonmasterBrokerProxy();

      const { typescript } = configDungeonmasterBroker();

      expect(
        typescript.rules?.[EslintRuleNameStub({ value: 'eslint-comments/no-unlimited-disable' })],
      ).toBe('error');
    });

    it('VALID: {} => typescript config includes eslint-comments no-use rule', () => {
      configDungeonmasterBrokerProxy();

      const { typescript } = configDungeonmasterBroker();

      expect(
        typescript.rules?.[EslintRuleNameStub({ value: 'eslint-comments/no-use' })],
      ).toStrictEqual(['error', { allow: [] }]);
    });

    it('VALID: {} => ruleEnforceOn contains require-object-contract-brands as pre-edit', () => {
      configDungeonmasterBrokerProxy();

      const { ruleEnforceOn } = configDungeonmasterBroker();

      expect(ruleEnforceOn['@dungeonmaster/require-object-contract-brands']).toBe('pre-edit');
    });

    it('VALID: {} => typescript config lands require-object-contract-brands off', () => {
      configDungeonmasterBrokerProxy();

      const { typescript } = configDungeonmasterBroker();

      expect(
        typescript.rules?.[
          EslintRuleNameStub({ value: '@dungeonmaster/require-object-contract-brands' })
        ],
      ).toBe('off');
    });

    it.each(['@dungeonmaster/ban-primitives', '@dungeonmaster/require-zod-on-primitives'])(
      'VALID: {} => typescript config and ruleEnforceOn no longer carry %s',
      (ruleName) => {
        configDungeonmasterBrokerProxy();

        const { typescript, ruleEnforceOn } = configDungeonmasterBroker();

        expect(typescript.rules?.[EslintRuleNameStub({ value: ruleName })]).toBe(undefined);
        expect(Reflect.has(ruleEnforceOn, ruleName)).toBe(false);
      },
    );

    it('VALID: {} => ruleEnforceOn contains enforce-object-destructuring-params as pre-edit', () => {
      configDungeonmasterBrokerProxy();

      const { ruleEnforceOn } = configDungeonmasterBroker();

      expect(ruleEnforceOn['@dungeonmaster/enforce-object-destructuring-params']).toBe('pre-edit');
    });

    it('VALID: {} => ruleEnforceOn contains no-explicit-any as pre-edit', () => {
      configDungeonmasterBrokerProxy();

      const { ruleEnforceOn } = configDungeonmasterBroker();

      expect(ruleEnforceOn['@typescript-eslint/no-explicit-any']).toBe('pre-edit');
    });

    it('VALID: {} => ruleEnforceOn contains eslint-comments no-use as pre-edit', () => {
      configDungeonmasterBrokerProxy();

      const { ruleEnforceOn } = configDungeonmasterBroker();

      expect(ruleEnforceOn['eslint-comments/no-use']).toBe('pre-edit');
    });

    it('VALID: {} => ruleEnforceOn contains ban-fetch-in-proxies as pre-edit', () => {
      configDungeonmasterBrokerProxy();

      const { ruleEnforceOn } = configDungeonmasterBroker();

      expect(ruleEnforceOn['@dungeonmaster/ban-fetch-in-proxies']).toBe('pre-edit');
    });

    it('VALID: {} => ruleEnforceOn contains ban-contract-type-predicates as pre-edit', () => {
      configDungeonmasterBrokerProxy();

      const { ruleEnforceOn } = configDungeonmasterBroker();

      expect(ruleEnforceOn['@dungeonmaster/ban-contract-type-predicates']).toBe('pre-edit');
    });

    it('VALID: {} => typescript config contains ban-contract-type-predicates rule at error', () => {
      configDungeonmasterBrokerProxy();

      const { typescript } = configDungeonmasterBroker();

      expect(
        typescript.rules?.[
          EslintRuleNameStub({ value: '@dungeonmaster/ban-contract-type-predicates' })
        ],
      ).toBe('error');
    });

    it('VALID: {} => ruleEnforceOn contains ban-type-aliases as pre-edit', () => {
      configDungeonmasterBrokerProxy();

      const { ruleEnforceOn } = configDungeonmasterBroker();

      expect(ruleEnforceOn['@dungeonmaster/ban-type-aliases']).toBe('pre-edit');
    });

    it('VALID: {} => typescript config registers ban-type-aliases off and ban-adhoc-types with no options', () => {
      configDungeonmasterBrokerProxy();

      const { typescript } = configDungeonmasterBroker();

      expect(
        typescript.rules?.[EslintRuleNameStub({ value: '@dungeonmaster/ban-type-aliases' })],
      ).toBe('off');
      expect(
        typescript.rules?.[EslintRuleNameStub({ value: '@dungeonmaster/ban-adhoc-types' })],
      ).toBe('error');
    });

    it('VALID: {} => typescript config registers ban-test-support-in-production at error', () => {
      configDungeonmasterBrokerProxy();

      const { typescript } = configDungeonmasterBroker();

      expect(
        typescript.rules?.[
          EslintRuleNameStub({ value: '@dungeonmaster/ban-test-support-in-production' })
        ],
      ).toBe('error');
    });

    it('VALID: {} => ruleEnforceOn contains ban-test-support-in-production as pre-edit', () => {
      configDungeonmasterBrokerProxy();

      const { ruleEnforceOn } = configDungeonmasterBroker();

      expect(ruleEnforceOn['@dungeonmaster/ban-test-support-in-production']).toBe('pre-edit');
    });

    it('VALID: {} => ruleEnforceOn contains ban-join-id-beside-child as pre-edit', () => {
      configDungeonmasterBrokerProxy();

      const { ruleEnforceOn } = configDungeonmasterBroker();

      expect(ruleEnforceOn['@dungeonmaster/ban-join-id-beside-child']).toBe('pre-edit');
    });

    it('VALID: {} => typescript config registers ban-join-id-beside-child off', () => {
      configDungeonmasterBrokerProxy();

      const { typescript } = configDungeonmasterBroker();

      expect(
        typescript.rules?.[
          EslintRuleNameStub({ value: '@dungeonmaster/ban-join-id-beside-child' })
        ],
      ).toBe('off');
    });

    it('VALID: {} => ruleEnforceOn contains enforce-proxy-patterns as post-edit', () => {
      configDungeonmasterBrokerProxy();

      const { ruleEnforceOn } = configDungeonmasterBroker();

      expect(ruleEnforceOn['@dungeonmaster/enforce-proxy-patterns']).toBe('post-edit');
    });

    it('VALID: {} => ruleEnforceOn contains enforce-proxy-child-creation as post-edit', () => {
      configDungeonmasterBrokerProxy();

      const { ruleEnforceOn } = configDungeonmasterBroker();

      expect(ruleEnforceOn['@dungeonmaster/enforce-proxy-child-creation']).toBe('post-edit');
    });

    it('VALID: {} => ruleEnforceOn contains enforce-implementation-colocation as post-edit', () => {
      configDungeonmasterBrokerProxy();

      const { ruleEnforceOn } = configDungeonmasterBroker();

      expect(ruleEnforceOn['@dungeonmaster/enforce-implementation-colocation']).toBe('post-edit');
    });

    it('VALID: {} => ruleEnforceOn contains enforce-test-colocation as post-edit', () => {
      configDungeonmasterBrokerProxy();

      const { ruleEnforceOn } = configDungeonmasterBroker();

      expect(ruleEnforceOn['@dungeonmaster/enforce-test-colocation']).toBe('post-edit');
    });
  });

  describe('gateway config', () => {
    it('VALID: {} => gateway files matches every gateway package glob', () => {
      configDungeonmasterBrokerProxy();

      const { gateway } = configDungeonmasterBroker();

      expect(gateway.files).toStrictEqual([
        'packages/@gateway/npm/src/**/*.ts',
        'packages/@gateway/node/src/**/*.ts',
        'packages/@gateway/browser/src/**/*.ts',
        'packages/@gateway/bin/src/**/*.ts',
      ]);
    });

    it.each([
      '@dungeonmaster/enforce-project-structure',
      '@dungeonmaster/enforce-object-destructuring-params',
      '@dungeonmaster/enforce-proxy-child-creation',
      '@dungeonmaster/enforce-stub-patterns',
      '@dungeonmaster/ban-adhoc-types',
    ])('VALID: {} => gateway rules omit %s (never set it to "off")', (ruleName) => {
      configDungeonmasterBrokerProxy();

      const { gateway } = configDungeonmasterBroker();

      expect(gateway.rules?.[EslintRuleNameStub({ value: ruleName })]).toBe(undefined);
    });

    it.each([
      '@dungeonmaster/enforce-file-metadata',
      '@dungeonmaster/ban-silent-catch',
      '@dungeonmaster/forbid-type-reexport',
      '@dungeonmaster/forbid-non-exported-functions',
      '@dungeonmaster/no-bare-process-cwd',
      '@typescript-eslint/no-explicit-any',
    ])('VALID: {} => gateway rules still apply %s as "error"', (ruleName) => {
      configDungeonmasterBrokerProxy();

      const { gateway } = configDungeonmasterBroker();

      expect(gateway.rules?.[EslintRuleNameStub({ value: ruleName })]).toBe('error');
    });

    it('VALID: {} => typescript and gateway rules set enforce-stub-usage with the outside-type-cast check off', () => {
      configDungeonmasterBrokerProxy();

      const { typescript, gateway } = configDungeonmasterBroker();
      const ruleName = EslintRuleNameStub({ value: '@dungeonmaster/enforce-stub-usage' });

      expect(typescript.rules?.[ruleName]).toStrictEqual(['error', { outsideTypeCasts: false }]);
      expect(gateway.rules?.[ruleName]).toStrictEqual(['error', { outsideTypeCasts: false }]);
    });

    it('VALID: {} => typescript config defaults gatewayLintConfig to an empty option', () => {
      configDungeonmasterBrokerProxy();

      const { typescript } = configDungeonmasterBroker();

      expect(
        typescript.rules?.[EslintRuleNameStub({ value: '@dungeonmaster/ban-gateway-export' })],
      ).toStrictEqual(['error', {}]);
    });

    it('VALID: {gatewayLintConfig} => threads the CALLER-supplied value into all three gateway config rules', () => {
      configDungeonmasterBrokerProxy();

      const gatewayLintConfig = GatewayLintConfigStub({
        bannedExports: [
          {
            subpath: '#gateway/node/fs',
            name: 'readFileSync',
            use: 'readFile',
            reason: 'blocks the event loop',
          },
        ],
      });

      const { typescript } = configDungeonmasterBroker({ gatewayLintConfig });

      expect(
        typescript.rules?.[EslintRuleNameStub({ value: '@dungeonmaster/ban-gateway-export' })],
      ).toStrictEqual(['error', gatewayLintConfig]);
      expect(
        typescript.rules?.[
          EslintRuleNameStub({ value: '@dungeonmaster/enforce-gateway-restricted-to' })
        ],
      ).toStrictEqual(['error', gatewayLintConfig]);
      expect(
        typescript.rules?.[
          EslintRuleNameStub({ value: '@dungeonmaster/enforce-gateway-config-names-exist' })
        ],
      ).toStrictEqual(['error', gatewayLintConfig]);
    });

    it('VALID: {} => gateway rules turn gateway-colocation requireStub on', () => {
      configDungeonmasterBrokerProxy();

      const { gateway } = configDungeonmasterBroker();

      expect(
        gateway.rules?.[EslintRuleNameStub({ value: '@dungeonmaster/gateway-colocation' })],
      ).toStrictEqual(['error', { requireStub: true }]);
    });

    it('VALID: {} => typescript (non-gateway) config keeps every rule the gateway omits', () => {
      configDungeonmasterBrokerProxy();

      const { typescript } = configDungeonmasterBroker();

      expect(
        typescript.rules?.[
          EslintRuleNameStub({ value: '@dungeonmaster/enforce-project-structure' })
        ],
      ).toBe('error');
      expect(
        typescript.rules?.[
          EslintRuleNameStub({ value: '@dungeonmaster/enforce-proxy-child-creation' })
        ],
      ).toStrictEqual(['error', { banWrapperMocks: false }]);
    });
  });

  describe('startup short-circuit override', () => {
    it('VALID: {} => fileOverrides includes startup short-circuit config targeting start-*.ts', () => {
      configDungeonmasterBrokerProxy();

      const { fileOverrides } = configDungeonmasterBroker();
      const startupConfig = fileOverrides.find((config) => {
        return Boolean(
          config.files?.some((file) => {
            return file === '**/startup/start-*.ts';
          }),
        );
      });

      expect(
        startupConfig?.rules?.[
          EslintRuleNameStub({ value: '@typescript-eslint/no-unused-expressions' })
        ],
      ).toStrictEqual(['error', { allowShortCircuit: true }]);
    });

    it('VALID: {} => startup short-circuit config ignores test files', () => {
      configDungeonmasterBrokerProxy();

      const { fileOverrides } = configDungeonmasterBroker();
      const startupConfig = fileOverrides.find((config) => {
        return Boolean(
          config.files?.some((file) => {
            return file === '**/startup/start-*.ts';
          }),
        );
      });

      expect(startupConfig?.ignores).toStrictEqual(['**/*.test.ts']);
    });
  });

  describe('forTesting parameter', () => {
    it('VALID: {forTesting: true} => test config has jest plugin key', () => {
      configDungeonmasterBrokerProxy();

      const { test } = configDungeonmasterBroker({ forTesting: true });

      expect('jest' in (test.plugins as object)).toBe(true);
    });

    it('VALID: {forTesting: true} => test config registers the real eslint-plugin-jest plugin object', () => {
      configDungeonmasterBrokerProxy();

      const { test } = configDungeonmasterBroker({ forTesting: true });

      expect((test.plugins as Record<PropertyKey, unknown>).jest).toBe(eslintPluginJest);
    });

    it('VALID: {forTesting: true} => test config disables magic numbers', () => {
      configDungeonmasterBrokerProxy();

      const { test } = configDungeonmasterBroker({ forTesting: true });

      expect(
        test.rules?.[EslintRuleNameStub({ value: '@typescript-eslint/no-magic-numbers' })],
      ).toBe('off');
    });

    it('VALID: {} => typescript config contains ban-negated-matchers rule', () => {
      configDungeonmasterBrokerProxy();

      const { typescript } = configDungeonmasterBroker();

      expect(
        typescript.rules?.[EslintRuleNameStub({ value: '@dungeonmaster/ban-negated-matchers' })],
      ).toBe('error');
    });

    it('VALID: {} => typescript config contains ban-tautological-assertions rule', () => {
      configDungeonmasterBrokerProxy();

      const { typescript } = configDungeonmasterBroker();

      expect(
        typescript.rules?.[
          EslintRuleNameStub({ value: '@dungeonmaster/ban-tautological-assertions' })
        ],
      ).toBe('error');
    });

    it('VALID: {} => typescript config contains ban-object-keys-in-expect rule', () => {
      configDungeonmasterBrokerProxy();

      const { typescript } = configDungeonmasterBroker();

      expect(
        typescript.rules?.[
          EslintRuleNameStub({ value: '@dungeonmaster/ban-object-keys-in-expect' })
        ],
      ).toBe('error');
    });

    it('VALID: {} => typescript config contains ban-string-includes-in-expect rule', () => {
      configDungeonmasterBrokerProxy();

      const { typescript } = configDungeonmasterBroker();

      expect(
        typescript.rules?.[
          EslintRuleNameStub({ value: '@dungeonmaster/ban-string-includes-in-expect' })
        ],
      ).toBe('error');
    });

    it('VALID: {forTesting: false} => typescript config keeps magic numbers enabled', () => {
      configDungeonmasterBrokerProxy();

      const { typescript } = configDungeonmasterBroker({ forTesting: false });

      expect(
        typescript.rules?.[EslintRuleNameStub({ value: '@typescript-eslint/no-magic-numbers' })],
      ).toStrictEqual([
        'error',
        {
          ignore: [-1, 0, 1],
          ignoreArrayIndexes: true,
          ignoreDefaultValues: true,
          ignoreClassFieldInitialValues: true,
          detectObjects: false,
          ignoreEnums: true,
          ignoreNumericLiteralTypes: true,
          ignoreReadonlyClassProperties: true,
          ignoreTypeIndexes: true,
        },
      ]);
    });
  });
});
