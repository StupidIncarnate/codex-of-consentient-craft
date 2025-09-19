import { resolve } from 'path';
import { existsSync } from 'fs';
import type { PreEditLintConfig, QuestmaestroHooksConfig } from '../../types/config-type';
import { hookConfigUtilMergeWithDefaults } from './hook-config-util-merge-with-defaults';
import { hookConfigUtilGetDefaultConfig } from './hook-config-util-get-default-config';

export const hookConfigUtilLoadConfig = ({
  cwd = process.cwd(),
}: { cwd?: string } = {}): PreEditLintConfig => {
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

        // eslint-disable-next-line @typescript-eslint/no-require-imports
        const config = require(configPath) as QuestmaestroHooksConfig;

        if (config.preEditLint) {
          return hookConfigUtilMergeWithDefaults({ config: config.preEditLint });
        }
      } catch (error) {
        throw new Error(
          `Failed to load config from ${configPath}: ${error instanceof Error ? error.message : String(error)}`,
        );
      }
    }
  }

  // No config found, return defaults
  return hookConfigUtilGetDefaultConfig();
};
