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

    expect(config).toStrictEqual({
      typescript: expect.any(Object),
      test: expect.any(Object),
      ruleEnforceOn: expect.any(Object),
      fileOverrides: expect.any(Array),
    });
  });

  it('VALID: {require @dungeonmaster/eslint-plugin} => returns module object', () => {
    const importPlugin = (): unknown => {
      return require('@dungeonmaster/eslint-plugin');
    };

    const module = importPlugin();

    expect(module).toStrictEqual(expect.any(Object));
  });
});
