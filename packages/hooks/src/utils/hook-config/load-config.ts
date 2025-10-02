import { resolve } from 'path';
import { existsSync } from 'fs';
import type { PreEditLintConfig, QuestmaestroHooksConfig } from '../../types/config-type';
import { mergeWithDefaults } from './merge-with-defaults';
import { getDefaultConfig } from './get-default-config';

const isQuestmaestroHooksConfig = (value: unknown): value is QuestmaestroHooksConfig =>
  typeof value === 'object' && value !== null && 'preEditLint' in value;

const loadConfigFile = ({ configPath }: { configPath: string }): PreEditLintConfig | null => {
  try {
    // Clear require cache to ensure fresh config loading
    Reflect.deleteProperty(require.cache, configPath);

    // Dynamic require for config file
    const loadedModule: unknown = require(configPath);

    if (isQuestmaestroHooksConfig(loadedModule) && loadedModule.preEditLint !== undefined) {
      return mergeWithDefaults({ config: loadedModule.preEditLint });
    }

    return null;
  } catch (error) {
    throw new Error(`Failed to load config from ${configPath}`, { cause: error });
  }
};

export const loadConfig = ({ cwd = process.cwd() }: { cwd?: string } = {}): PreEditLintConfig => {
  const configPaths = [
    resolve(cwd, '.questmaestro-hooks.config.js'),
    resolve(cwd, '.questmaestro-hooks.config.mjs'),
    resolve(cwd, '.questmaestro-hooks.config.cjs'),
  ];

  for (const configPath of configPaths) {
    if (existsSync(configPath)) {
      const config = loadConfigFile({ configPath });
      if (config !== null) {
        return config;
      }
    }
  }

  // No config found, return defaults
  return getDefaultConfig();
};
