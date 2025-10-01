import { resolve } from 'path';
import { existsSync } from 'fs';
import type { PreEditLintConfig, QuestmaestroHooksConfig } from '../../types/config-type';
import { mergeWithDefaults } from './merge-with-defaults';
import { getDefaultConfig } from './get-default-config';

export const loadConfig = ({ cwd = process.cwd() }: { cwd?: string } = {}): PreEditLintConfig => {
  const configPaths = [
    resolve(cwd, '.questmaestro-hooks.config.js'),
    resolve(cwd, '.questmaestro-hooks.config.mjs'),
    resolve(cwd, '.questmaestro-hooks.config.cjs'),
  ];

  for (const configPath of configPaths) {
    if (existsSync(configPath)) {
      try {
        // Clear require cache to ensure fresh config loading
        delete require.cache[configPath];

        const config = require(configPath) as QuestmaestroHooksConfig;

        if (config.preEditLint) {
          return mergeWithDefaults({ config: config.preEditLint });
        }
      } catch (error) {
        throw new Error(
          `Failed to load config from ${configPath}: ${error instanceof Error ? error.message : String(error)}`,
        );
      }
    }
  }

  // No config found, return defaults
  return getDefaultConfig();
};
