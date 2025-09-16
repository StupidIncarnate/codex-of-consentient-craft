import { resolve } from 'path';
import { existsSync } from 'fs';
import type { PreEditLintConfig, QuestmaestroHooksConfig } from '../pre-edit-lint/types';

export const HookConfigLoader = {
  loadConfig: ({ cwd = process.cwd() }: { cwd?: string } = {}): PreEditLintConfig => {
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
            return HookConfigLoader.mergeWithDefaults({ config: config.preEditLint });
          }
        } catch (error) {
          throw new Error(
            `Failed to load config from ${configPath}: ${error instanceof Error ? error.message : String(error)}`,
          );
        }
      }
    }

    // No config found, return defaults
    return HookConfigLoader.getPreEditLintDefaultConfig();
  },

  mergeWithDefaults: ({ config }: { config: PreEditLintConfig }): PreEditLintConfig => {
    const defaults = HookConfigLoader.getPreEditLintDefaultConfig();

    return {
      rules: config.rules || defaults.rules,
      messages: config.messages || {},
    };
  },

  getPreEditLintDefaultConfig: (): PreEditLintConfig => ({
    rules: [
      '@typescript-eslint/no-explicit-any',
      '@typescript-eslint/ban-ts-comment',
      'eslint-comments/no-use',
    ],
    messages: {},
  }),
};
