import { configDungeonmasterBroker } from './brokers/config/dungeonmaster/config-dungeonmaster-broker';

/**
 * Integration test to ensure the eslint-plugin module can be loaded correctly.
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

    expect(Object.keys(config).sort()).toStrictEqual([
      'fileOverrides',
      'ruleEnforceOn',
      'test',
      'typescript',
    ]);
  });

  it('VALID: {import @dungeonmaster/eslint-plugin} => exports a callable configDungeonmasterBroker producing the full config', async () => {
    const module = (await import('@dungeonmaster/eslint-plugin')) as {
      configDungeonmasterBroker: typeof configDungeonmasterBroker;
    };

    expect(module.configDungeonmasterBroker.name).toBe('configDungeonmasterBroker');

    const config = module.configDungeonmasterBroker();

    expect(Object.keys(config).sort()).toStrictEqual([
      'fileOverrides',
      'ruleEnforceOn',
      'test',
      'typescript',
    ]);
  });
});
