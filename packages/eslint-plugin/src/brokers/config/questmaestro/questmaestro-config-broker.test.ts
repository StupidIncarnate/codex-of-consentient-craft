import { questmaestroConfigBroker } from './questmaestro-config-broker';

describe('questmaestroConfigBroker', () => {
  describe('return value structure', () => {
    it('VALID: {} => returns object with typescript, test, and fileOverrides configs', () => {
      const result = questmaestroConfigBroker();

      expect(result.typescript).toBeDefined();
      expect(result.test).toBeDefined();
      expect(result.fileOverrides).toBeDefined();
      expect(Array.isArray(result.fileOverrides)).toBe(true);
    });

    it('VALID: {} => typescript config contains main rules', () => {
      const { typescript } = questmaestroConfigBroker();

      expect(typescript).toBeDefined();
      expect(typescript.rules).toBeDefined();
      expect(typescript.rules?.['@questmaestro/ban-contract-in-tests']).toBe('error');
      expect(typescript.rules?.['@questmaestro/enforce-object-destructuring-params']).toBe('error');
    });

    it('VALID: {} => fileOverrides includes stub file config', () => {
      const { fileOverrides } = questmaestroConfigBroker();
      const stubConfig = fileOverrides.find((config) => {
        return config.files?.some((file) => file === '**/*.stub.ts');
      });

      expect(stubConfig).toBeDefined();
      expect(stubConfig?.files).toStrictEqual(['**/*.stub.ts', '**/*.stub.tsx']);
      expect(stubConfig?.rules?.['@typescript-eslint/no-magic-numbers']).toBe('off');
    });

    it('VALID: {} => typescript config includes TypeScript rules', () => {
      const { typescript } = questmaestroConfigBroker();

      expect(typescript).toBeDefined();
      expect(typescript.rules?.['@typescript-eslint/no-explicit-any']).toBe('error');
      expect(typescript.rules?.['@typescript-eslint/explicit-function-return-type']).toBeDefined();
    });

    it('VALID: {} => typescript config includes eslint-comments rules', () => {
      const { typescript } = questmaestroConfigBroker();

      expect(typescript).toBeDefined();
      expect(typescript.rules?.['eslint-comments/no-unlimited-disable']).toBe('error');
      expect(typescript.rules?.['eslint-comments/no-use']).toBeDefined();
    });
  });

  describe('forTesting parameter', () => {
    it('VALID: {forTesting: true} => test config has jest plugin', () => {
      const { test } = questmaestroConfigBroker({ forTesting: true });

      expect(test).toBeDefined();
      expect(test.plugins).toBeDefined();
      expect(test.plugins?.jest).toBeDefined();
    });

    it('VALID: {forTesting: true} => test config disables magic numbers', () => {
      const { test } = questmaestroConfigBroker({ forTesting: true });

      expect(test).toBeDefined();
      expect(test.rules?.['@typescript-eslint/no-magic-numbers']).toBe('off');
    });

    it('VALID: {forTesting: false} => typescript config keeps magic numbers enabled', () => {
      const { typescript } = questmaestroConfigBroker({ forTesting: false });

      expect(typescript).toBeDefined();
      expect(typescript.rules?.['@typescript-eslint/no-magic-numbers']).not.toBe('off');
    });
  });
});
