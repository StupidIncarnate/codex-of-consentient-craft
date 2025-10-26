import { configQuestmaestroBroker } from './brokers/config/questmaestro/config-questmaestro-broker';

/**
 * E2E test to ensure the eslint-plugin module can be loaded correctly.
 *
 * This catches build configuration issues where:
 * - package.json "main" doesn't match the actual compiled output location
 * - TypeScript compiles to wrong directory (e.g., dist/src/ vs dist/)
 * - Module exports are broken
 *
 * If this test fails, it likely means:
 * 1. The package hasn't been built: run `npm run build --workspace=@questmaestro/eslint-plugin`
 * 2. The tsconfig.json rootDir setting doesn't match package.json main entry point
 * 3. The dist folder structure has changed but package.json wasn't updated
 */

describe('ESLint Plugin Module Loading', () => {
  it('should be able to call configQuestmaestroBroker without errors', () => {
    // This ensures the module and all its dependencies load correctly
    expect(() => {
      return configQuestmaestroBroker();
    }).not.toThrow();
  });

  it('should return valid config from configQuestmaestroBroker', () => {
    const config = configQuestmaestroBroker();

    expect(config).toBeDefined();
    expect(config.typescript).toBeDefined();
    expect(config.test).toBeDefined();
    expect(config.ruleEnforceOn).toBeDefined();
    expect(config.fileOverrides).toBeDefined();
  });

  it('should be able to require the built package from node_modules', () => {
    // This import will fail if the package.json "main" doesn't point to a valid file
    // or if the module structure is broken
    const importPlugin = (): unknown => {
      return require('@questmaestro/eslint-plugin');
    };

    expect(importPlugin).not.toThrow();

    const module = importPlugin();

    expect(module).toBeDefined();
  });
});
