/**
 * PURPOSE: Loads dungeonmaster hooks configuration from .dungeonmaster-hooks.config files
 *
 * USAGE:
 * const config = hookConfigLoadBroker({ cwd: '/project/path' });
 * // Returns PreEditLintConfig from config file or defaults
 */
import { pathResolveAdapter } from '../../../adapters/path/resolve/path-resolve-adapter';
import { fsExistsSyncAdapter } from '../../../adapters/fs/exists-sync/fs-exists-sync-adapter';
import { moduleRequireFreshAdapter } from '../../../adapters/module/require-fresh/module-require-fresh-adapter';
import type { PreEditLintConfig } from '../../../contracts/pre-edit-lint-config/pre-edit-lint-config-contract';
import { hookConfigDefaultBroker } from '../default/hook-config-default-broker';
import { hookConfigMergeBroker } from '../merge/hook-config-merge-broker';
import type { FilePath } from '../../../contracts/file-path/file-path-contract';
import { filePathContract } from '../../../contracts/file-path/file-path-contract';
import { dungeonmasterHooksConfigContract } from '../../../contracts/dungeonmaster-hooks-config/dungeonmaster-hooks-config-contract';
import { processCwdAdapter } from '@dungeonmaster/shared/adapters';
import { locationsStatics } from '@dungeonmaster/shared/statics';

export const hookConfigLoadBroker = ({ cwd }: { cwd?: FilePath } = {}): PreEditLintConfig => {
  const workingDir = cwd ?? processCwdAdapter();
  // Skip the .ts variant (index 0) — require() cannot load TypeScript without a transpiler.
  const configPaths = locationsStatics.hooks.configFiles
    .filter((f) => !f.endsWith('.ts'))
    .map((filename) => pathResolveAdapter({ paths: [workingDir, filename] }));

  for (const configPath of configPaths) {
    if (fsExistsSyncAdapter({ filePath: configPath })) {
      try {
        const loadedModule: unknown = moduleRequireFreshAdapter({
          filePath: filePathContract.parse(configPath),
        });

        const parseResult = dungeonmasterHooksConfigContract.safeParse(loadedModule);
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
