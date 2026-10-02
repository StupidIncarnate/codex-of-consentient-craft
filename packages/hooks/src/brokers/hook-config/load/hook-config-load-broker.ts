/**
 * PURPOSE: Loads dungeonmaster hooks configuration from .dungeonmaster-hooks.config files
 *
 * USAGE:
 * const config = hookConfigLoadBroker({ cwd: '/project/path' });
 * // Returns PreEditLintConfig from config file or defaults
 */
import { resolve } from '#gateway/node/path';
import { existsSync } from '#gateway/node/fs';
import { createRequire } from '#gateway/node/module';
import type { PreEditLintConfig } from '../../../contracts/pre-edit-lint-config/pre-edit-lint-config-contract';
import { hookConfigDefaultBroker } from '../default/hook-config-default-broker';
import { hookConfigMergeBroker } from '../merge/hook-config-merge-broker';
import { dungeonmasterHooksConfigContract } from '../../../contracts/dungeonmaster-hooks-config/dungeonmaster-hooks-config-contract';
import { locationsStatics } from '@dungeonmaster/shared/statics';

const req = createRequire(__filename);

export const hookConfigLoadBroker = ({ cwd: workingDir }: { cwd: string }): PreEditLintConfig => {
  // Skip the .ts variant (index 0) — require() cannot load TypeScript without a transpiler.
  const configPaths = locationsStatics.hooks.configFiles
    .filter((f) => !f.endsWith('.ts'))
    .map((filename) => resolve(workingDir, filename));

  for (const configPath of configPaths) {
    if (existsSync(configPath)) {
      try {
        Reflect.deleteProperty(req.cache, configPath);
        const loadedModule: unknown = req(configPath);

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
