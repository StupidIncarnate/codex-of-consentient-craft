import { configDungeonmasterBroker } from './config-dungeonmaster-broker';
import { configDungeonmasterBrokerProxy } from './config-dungeonmaster-broker.proxy';

describe('configDungeonmasterBroker', () => {
  describe('return value structure', () => {
    it('VALID: {} => returns object with typescript, test, fileOverrides, and ruleEnforceOn keys', () => {
      configDungeonmasterBrokerProxy();

      const result = configDungeonmasterBroker();

      const keys = Object.keys(result).sort();

      expect(keys).toStrictEqual(['fileOverrides', 'ruleEnforceOn', 'test', 'typescript']);
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
