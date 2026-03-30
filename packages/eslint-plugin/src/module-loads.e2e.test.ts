import { configDungeonmasterBroker } from './brokers/config/dungeonmaster/config-dungeonmaster-broker';

/**
 * E2E test to ensure the eslint-plugin module can be loaded correctly.
 *
 * This catches build configuration issues where:
 * - package.json "main" doesn't match the actual compiled output location
 * - TypeScript compiles to wrong directory (e.g., dist/src/ vs dist/)
 * - Module exports are broken
 *
 * If this test fails, it likely means:
 * 1. The package hasn't been built: run `npm run build --workspace=@dungeonmaster/eslint-plugin`
 * 2. The tsconfig.json rootDir setting doesn't match package.json main entry point
 * 3. The dist folder structure has changed but package.json wasn't updated
 */

describe('ESLint Plugin Module Loading', () => {
  it('VALID: {configDungeonmasterBroker} => returns config with typescript and test keys', () => {
    const config = configDungeonmasterBroker();

    const configKeys = Object.keys(config);

    expect(configKeys).toStrictEqual(['typescript', 'test', 'fileOverrides', 'ruleEnforceOn']);
  });

  it('VALID: {require @dungeonmaster/eslint-plugin} => returns module with StartEslintPlugin export', () => {
    const importPlugin = (): unknown => {
      return require('@dungeonmaster/eslint-plugin');
    };

    const module = importPlugin() as {
      configDungeonmasterBroker: typeof configDungeonmasterBroker;
    };

    expect(module.configDungeonmasterBroker).toBe(configDungeonmasterBroker);
  });
});
