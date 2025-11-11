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
import { hookConfigDefaultBroker } from '../default/hook-config-default-broker';
import { hookConfigMergeBroker } from '../merge/hook-config-merge-broker';
import type { FilePath } from '../../../contracts/file-path/file-path-contract';
import { filePathContract } from '../../../contracts/file-path/file-path-contract';
import { questmaestroHooksConfigContract } from '../../../contracts/questmaestro-hooks-config/questmaestro-hooks-config-contract';

export const hookConfigLoadBroker = ({ cwd }: { cwd?: FilePath } = {}): PreEditLintConfig => {
  const workingDir = cwd ?? filePathContract.parse(process.cwd());
  const configPaths = [
    pathResolveAdapter({ paths: [workingDir, '.questmaestro-hooks.config.js'] }),
    pathResolveAdapter({ paths: [workingDir, '.questmaestro-hooks.config.mjs'] }),
    pathResolveAdapter({ paths: [workingDir, '.questmaestro-hooks.config.cjs'] }),
  ];

  for (const configPath of configPaths) {
    if (fsExistsSyncAdapter({ filePath: configPath })) {
      try {
        // Clear require cache to ensure fresh config loading
        Reflect.deleteProperty(require.cache, configPath);

        // Dynamic require for config file with contract validation
        const loadedModule: unknown = require(filePathContract.parse(configPath));

        const parseResult = questmaestroHooksConfigContract.safeParse(loadedModule);
        if (!parseResult.success) {
          continue;
        }

        // Contract has validated and typed the config
        if (parseResult.data.preEditLint !== undefined) {
          return hookConfigMergeBroker({ config: parseResult.data.preEditLint });
        }
      } catch (error) {
        throw new Error(`Failed to load config from ${configPath}`, { cause: error });
      }
    }
  }

  // No config found, return defaults
  return hookConfigDefaultBroker();
};
