import { configDungeonmasterBroker } from './config-dungeonmaster-broker';
import { configDungeonmasterBrokerProxy } from './config-dungeonmaster-broker.proxy';
import { GatewayLintConfigStub } from '../../../contracts/gateway-lint-config/gateway-lint-config.stub';

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

    it('VALID: {} => typescript config contains enforce-contract-usage-in-tests rule', () => {
      configDungeonmasterBrokerProxy();

      const { typescript } = configDungeonmasterBroker();

      expect(typescript.rules?.['@dungeonmaster/enforce-contract-usage-in-tests']).toBe('error');
    });

    it('VALID: {} => typescript config contains enforce-object-destructuring-params rule', () => {
      configDungeonmasterBrokerProxy();

      const { typescript } = configDungeonmasterBroker();

      expect(typescript.rules?.['@dungeonmaster/enforce-object-destructuring-params']).toBe(
        'error',
      );
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

      expect(stubConfig?.rules?.['@typescript-eslint/no-magic-numbers']).toBe('off');
    });

    it('VALID: {} => typescript config includes no-explicit-any rule', () => {
      configDungeonmasterBrokerProxy();

      const { typescript } = configDungeonmasterBroker();

      expect(typescript.rules?.['@typescript-eslint/no-explicit-any']).toBe('error');
    });

    it('VALID: {} => typescript config includes explicit-function-return-type rule', () => {
      configDungeonmasterBrokerProxy();

      const { typescript } = configDungeonmasterBroker();

      expect(typescript.rules?.['@typescript-eslint/explicit-function-return-type']).toStrictEqual([
        'error',
        { allowExpressions: true },
      ]);
    });

    it('VALID: {} => typescript config includes eslint-comments no-unlimited-disable rule', () => {
      configDungeonmasterBrokerProxy();

      const { typescript } = configDungeonmasterBroker();

      expect(typescript.rules?.['eslint-comments/no-unlimited-disable']).toBe('error');
    });

    it('VALID: {} => typescript config includes eslint-comments no-use rule', () => {
      configDungeonmasterBrokerProxy();

      const { typescript } = configDungeonmasterBroker();

      expect(typescript.rules?.['eslint-comments/no-use']).toStrictEqual(['error', { allow: [] }]);
    });

    it('VALID: {} => ruleEnforceOn contains ban-primitives as pre-edit', () => {
      configDungeonmasterBrokerProxy();

      const { ruleEnforceOn } = configDungeonmasterBroker();

      expect(ruleEnforceOn['@dungeonmaster/ban-primitives']).toBe('pre-edit');
    });

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

      expect(gateway.rules?.[ruleName]).toBe(undefined);
    });

    it.each([
      '@dungeonmaster/enforce-file-metadata',
      '@dungeonmaster/ban-silent-catch',
      '@dungeonmaster/forbid-type-reexport',
      '@dungeonmaster/forbid-non-exported-functions',
      '@dungeonmaster/no-bare-process-cwd',
      '@typescript-eslint/no-explicit-any',
      '@dungeonmaster/enforce-stub-usage',
    ])('VALID: {} => gateway rules still apply %s as "error"', (ruleName) => {
      configDungeonmasterBrokerProxy();

      const { gateway } = configDungeonmasterBroker();

      expect(gateway.rules?.[ruleName]).toBe('error');
    });

    // ban-primitives stays configured 'error' (with options) in the gateway config too — its
    // OWN file-gate calls isGatewayFileGuard directly (rule-ban-primitives-broker.ts), because
    // the TEST rule block that also carries this key is not carved out by file glob, so the
    // rule has to recognize the gateway itself, in both implementation and test files.
    it('VALID: {} => gateway rules still apply ban-primitives configured', () => {
      configDungeonmasterBrokerProxy();

      const { gateway } = configDungeonmasterBroker();

      expect(gateway.rules?.['@dungeonmaster/ban-primitives']).toStrictEqual([
        'error',
        { allowPrimitiveInputs: true, allowPrimitiveReturns: false },
      ]);
    });

    it('VALID: {} => typescript config defaults gatewayLintConfig to an empty option', () => {
      configDungeonmasterBrokerProxy();

      const { typescript } = configDungeonmasterBroker();

      expect(typescript.rules?.['@dungeonmaster/ban-gateway-export']).toStrictEqual(['error', {}]);
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

      expect(typescript.rules?.['@dungeonmaster/ban-gateway-export']).toStrictEqual([
        'error',
        gatewayLintConfig,
      ]);
      expect(typescript.rules?.['@dungeonmaster/enforce-gateway-restricted-to']).toStrictEqual([
        'error',
        gatewayLintConfig,
      ]);
      expect(typescript.rules?.['@dungeonmaster/enforce-gateway-config-names-exist']).toStrictEqual(
        ['error', gatewayLintConfig],
      );
    });

    it('VALID: {} => typescript (non-gateway) config keeps every rule the gateway omits', () => {
      configDungeonmasterBrokerProxy();

      const { typescript } = configDungeonmasterBroker();

      expect(typescript.rules?.['@dungeonmaster/enforce-project-structure']).toBe('error');
      expect(typescript.rules?.['@dungeonmaster/enforce-proxy-child-creation']).toBe('error');
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

      expect(startupConfig?.rules?.['@typescript-eslint/no-unused-expressions']).toStrictEqual([
        'error',
        { allowShortCircuit: true },
      ]);
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

    it('VALID: {forTesting: true} => test config disables magic numbers', () => {
      configDungeonmasterBrokerProxy();

      const { test } = configDungeonmasterBroker({ forTesting: true });

      expect(test.rules?.['@typescript-eslint/no-magic-numbers']).toBe('off');
    });

    it('VALID: {} => typescript config contains ban-negated-matchers rule', () => {
      configDungeonmasterBrokerProxy();

      const { typescript } = configDungeonmasterBroker();

      expect(typescript.rules?.['@dungeonmaster/ban-negated-matchers']).toBe('error');
    });

    it('VALID: {} => typescript config contains ban-tautological-assertions rule', () => {
      configDungeonmasterBrokerProxy();

      const { typescript } = configDungeonmasterBroker();

      expect(typescript.rules?.['@dungeonmaster/ban-tautological-assertions']).toBe('error');
    });

    it('VALID: {} => typescript config contains ban-object-keys-in-expect rule', () => {
      configDungeonmasterBrokerProxy();

      const { typescript } = configDungeonmasterBroker();

      expect(typescript.rules?.['@dungeonmaster/ban-object-keys-in-expect']).toBe('error');
    });

    it('VALID: {} => typescript config contains ban-string-includes-in-expect rule', () => {
      configDungeonmasterBrokerProxy();

      const { typescript } = configDungeonmasterBroker();

      expect(typescript.rules?.['@dungeonmaster/ban-string-includes-in-expect']).toBe('error');
    });

    it('VALID: {forTesting: false} => typescript config keeps magic numbers enabled', () => {
      configDungeonmasterBrokerProxy();

      const { typescript } = configDungeonmasterBroker({ forTesting: false });

      expect(typescript.rules?.['@typescript-eslint/no-magic-numbers']).toStrictEqual([
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
