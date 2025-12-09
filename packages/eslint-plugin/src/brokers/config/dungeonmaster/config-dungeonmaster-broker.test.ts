import { configDungeonmasterBroker } from './config-dungeonmaster-broker';
import { configDungeonmasterBrokerProxy } from './config-dungeonmaster-broker.proxy';

describe('configDungeonmasterBroker', () => {
  describe('return value structure', () => {
    it('VALID: {} => returns object with typescript, test, fileOverrides, and ruleEnforceOn configs', () => {
      configDungeonmasterBrokerProxy();

      const result = configDungeonmasterBroker();

      expect(result.typescript).toBeDefined();
      expect(result.test).toBeDefined();
      expect(result.fileOverrides).toBeDefined();
      expect(Array.isArray(result.fileOverrides)).toBe(true);
      expect(result.ruleEnforceOn).toBeDefined();
    });

    it('VALID: {} => typescript config contains main rules', () => {
      configDungeonmasterBrokerProxy();

      const { typescript } = configDungeonmasterBroker();

      expect(typescript).toBeDefined();
      expect(typescript.rules).toBeDefined();
      expect(typescript.rules?.['@dungeonmaster/enforce-contract-usage-in-tests']).toBe('error');
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

      expect(stubConfig).toBeDefined();
      expect(stubConfig?.files).toStrictEqual(['**/*.stub.ts', '**/*.stub.tsx']);
      expect(stubConfig?.rules?.['@typescript-eslint/no-magic-numbers']).toBe('off');
    });

    it('VALID: {} => typescript config includes TypeScript rules', () => {
      configDungeonmasterBrokerProxy();

      const { typescript } = configDungeonmasterBroker();

      expect(typescript).toBeDefined();
      expect(typescript.rules?.['@typescript-eslint/no-explicit-any']).toBe('error');
      expect(typescript.rules?.['@typescript-eslint/explicit-function-return-type']).toBeDefined();
    });

    it('VALID: {} => typescript config includes eslint-comments rules', () => {
      configDungeonmasterBrokerProxy();

      const { typescript } = configDungeonmasterBroker();

      expect(typescript).toBeDefined();
      expect(typescript.rules?.['eslint-comments/no-unlimited-disable']).toBe('error');
      expect(typescript.rules?.['eslint-comments/no-use']).toBeDefined();
    });

    it('VALID: {} => ruleEnforceOn contains pre-edit rules', () => {
      configDungeonmasterBrokerProxy();

      const { ruleEnforceOn } = configDungeonmasterBroker();

      expect(ruleEnforceOn['@dungeonmaster/ban-primitives']).toBe('pre-edit');
      expect(ruleEnforceOn['@dungeonmaster/enforce-object-destructuring-params']).toBe('pre-edit');
      expect(ruleEnforceOn['@typescript-eslint/no-explicit-any']).toBe('pre-edit');
      expect(ruleEnforceOn['eslint-comments/no-use']).toBe('pre-edit');
    });

    it('VALID: {} => ruleEnforceOn contains post-edit rules', () => {
      configDungeonmasterBrokerProxy();

      const { ruleEnforceOn } = configDungeonmasterBroker();

      expect(ruleEnforceOn['@dungeonmaster/enforce-proxy-patterns']).toBe('post-edit');
      expect(ruleEnforceOn['@dungeonmaster/enforce-proxy-child-creation']).toBe('post-edit');
      expect(ruleEnforceOn['@dungeonmaster/enforce-implementation-colocation']).toBe('post-edit');
      expect(ruleEnforceOn['@dungeonmaster/enforce-test-colocation']).toBe('post-edit');
    });
  });

  describe('forTesting parameter', () => {
    it('VALID: {forTesting: true} => test config has jest plugin', () => {
      configDungeonmasterBrokerProxy();

      const { test } = configDungeonmasterBroker({ forTesting: true });

      expect(test).toBeDefined();
      expect(test.plugins).toBeDefined();
      expect(test.plugins?.jest).toBeDefined();
    });

    it('VALID: {forTesting: true} => test config disables magic numbers', () => {
      configDungeonmasterBrokerProxy();

      const { test } = configDungeonmasterBroker({ forTesting: true });

      expect(test).toBeDefined();
      expect(test.rules?.['@typescript-eslint/no-magic-numbers']).toBe('off');
    });

    it('VALID: {forTesting: false} => typescript config keeps magic numbers enabled', () => {
      configDungeonmasterBrokerProxy();

      const { typescript } = configDungeonmasterBroker({ forTesting: false });

      expect(typescript).toBeDefined();
      expect(typescript.rules?.['@typescript-eslint/no-magic-numbers']).not.toBe('off');
    });
  });
});
