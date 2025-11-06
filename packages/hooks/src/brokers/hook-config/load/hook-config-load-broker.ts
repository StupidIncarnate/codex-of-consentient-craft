/**
 * PURPOSE: Loads questmaestro hooks configuration from .questmaestro-hooks.config files
 *
 * USAGE:
 * const config = hookConfigLoadBroker({ cwd: '/project/path' });
 * // Returns PreEditLintConfig from config file or defaults
 */
import { pathResolveAdapter } from '../../../adapters/path/resolve/path-resolve-adapter';
import { fsExistsSyncAdapter } from '../../../adapters/fs/exists-sync/fs-exists-sync-adapter';
import type { PreEditLintConfig } from '../../../contracts/pre-edit-lint-config/pre-edit-lint-config-contract';
import type { QuestmaestroHooksConfig } from '../../../contracts/questmaestro-hooks-config/questmaestro-hooks-config-contract';
import { hookConfigMergeTransformer } from '../../../transformers/hook-config-merge/hook-config-merge-transformer';
import { hookConfigDefaultTransformer } from '../../../transformers/hook-config-default/hook-config-default-transformer';

const isQuestmaestroHooksConfig = (value: unknown): value is QuestmaestroHooksConfig =>
  typeof value === 'object' && value !== null && 'preEditLint' in value;

const loadConfigFile = ({ configPath }: { configPath: string }): PreEditLintConfig | null => {
  try {
    // Clear require cache to ensure fresh config loading
    Reflect.deleteProperty(require.cache, configPath);

    // Dynamic require for config file
    const loadedModule: unknown = require(configPath);

    if (isQuestmaestroHooksConfig(loadedModule) && loadedModule.preEditLint !== undefined) {
      return hookConfigMergeTransformer({ config: loadedModule.preEditLint });
    }

    return null;
  } catch (error) {
    throw new Error(`Failed to load config from ${configPath}`, { cause: error });
  }
};

export const hookConfigLoadBroker = ({
  cwd = process.cwd(),
}: { cwd?: string } = {}): PreEditLintConfig => {
  const configPaths = [
    pathResolveAdapter({ paths: [cwd, '.questmaestro-hooks.config.js'] }),
    pathResolveAdapter({ paths: [cwd, '.questmaestro-hooks.config.mjs'] }),
    pathResolveAdapter({ paths: [cwd, '.questmaestro-hooks.config.cjs'] }),
  ];

  for (const configPath of configPaths) {
    if (fsExistsSyncAdapter({ filePath: configPath })) {
      const config = loadConfigFile({ configPath });
      if (config !== null) {
        return config;
      }
    }
  }

  // No config found, return defaults
  return hookConfigDefaultTransformer();
};
