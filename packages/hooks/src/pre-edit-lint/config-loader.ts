import { resolve } from 'path';
import { existsSync } from 'fs';
import type { PreEditLintConfig, QuestmaestroHooksConfig } from './types';

export const ConfigLoader = {
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

          const config = require(configPath) as QuestmaestroHooksConfig;

          if (config.preEditLint) {
            return ConfigLoader.mergeWithDefaults({ config: config.preEditLint });
          }
        } catch (error) {
          throw new Error(
            `Failed to load config from ${configPath}: ${error instanceof Error ? error.message : String(error)}`,
          );
        }
      }
    }

    // No config found, return defaults
    return ConfigLoader.getDefaultConfig();
  },

  mergeWithDefaults: ({ config }: { config: PreEditLintConfig }): PreEditLintConfig => {
    const defaults = ConfigLoader.getDefaultConfig();

    return {
      rules: config.rules || defaults.rules,
      messages: config.messages || {},
      timeout: config.timeout ?? defaults.timeout,
      validateRules: config.validateRules ?? defaults.validateRules,
    };
  },

  getDefaultConfig: (): PreEditLintConfig => ({
    rules: [
      '@typescript-eslint/no-explicit-any',
      '@typescript-eslint/ban-ts-comment',
      'eslint-comments/no-use',
    ],
    messages: {},
    timeout: 10000,
    validateRules: true,
  }),

  validateConfigStructure: (config: unknown): config is PreEditLintConfig => {
    if (!config || typeof config !== 'object') {
      return false;
    }

    const c = config as Partial<PreEditLintConfig>;

    if (!Array.isArray(c.rules)) {
      return false;
    }

    if (!c.rules.every((rule) => typeof rule === 'string')) {
      return false;
    }

    if (c.messages && typeof c.messages !== 'object') {
      return false;
    }

    if (c.messages) {
      for (const [key, value] of Object.entries(c.messages)) {
        if (typeof key !== 'string' || (typeof value !== 'string' && typeof value !== 'function')) {
          return false;
        }
      }
    }

    if (c.timeout !== undefined && typeof c.timeout !== 'number') {
      return false;
    }

    if (c.validateRules !== undefined && typeof c.validateRules !== 'boolean') {
      return false;
    }

    return true;
  },
};
