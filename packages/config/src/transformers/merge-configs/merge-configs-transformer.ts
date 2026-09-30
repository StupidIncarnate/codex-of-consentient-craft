/**
 * PURPOSE: Merges multiple Dungeonmaster configuration objects with package-specific settings taking precedence
 *
 * USAGE:
 * mergeConfigsTransformer({configs: [rootConfig, packageConfig]});
 * // Returns merged configuration with package config overriding root config
 */

import { dungeonmasterConfigContract } from '../../contracts/dungeonmaster-config/dungeonmaster-config-contract';
import type { DungeonmasterConfig } from '../../contracts/dungeonmaster-config/dungeonmaster-config-contract';

export const mergeConfigsTransformer = ({
  configs,
}: {
  configs: DungeonmasterConfig[];
}): DungeonmasterConfig => {
  if (configs.length === 0) {
    throw new Error('Cannot merge empty configs array');
  }

  const [firstConfig, ...restConfigs] = configs;
  if (!firstConfig) {
    throw new Error('First config is undefined');
  }

  if (restConfigs.length === 0) {
    return firstConfig;
  }

  // Start with the first config (usually monorepo root)
  const merged = { ...firstConfig };

  // Merge each subsequent config
  for (const config of restConfigs) {
    // Framework from package-specific config always wins
    merged.framework = config.framework;

    // Routing from package-specific config if present
    if (config.routing) {
      merged.routing = config.routing;
    }

    // Schema from package-specific config always wins
    merged.schema = config.schema;

    // Merge architecture settings
    if (config.architecture) {
      const architecture =
        merged.architecture ?? dungeonmasterConfigContract.shape.architecture.unwrap().parse({});
      merged.architecture = architecture;

      // Merge overrides
      if (config.architecture.overrides) {
        architecture.overrides = {
          ...architecture.overrides,
          ...config.architecture.overrides,
        };
      }

      // Package-specific settings win
      if (config.architecture.allowedRootFiles) {
        architecture.allowedRootFiles = config.architecture.allowedRootFiles;
      }

      if (config.architecture.booleanFunctionPrefixes) {
        architecture.booleanFunctionPrefixes = config.architecture.booleanFunctionPrefixes;
      }
    }
  }

  return merged;
};
