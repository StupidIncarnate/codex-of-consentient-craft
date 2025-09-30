import type { QuestmaestroConfig } from '../../contracts/questmaestro-config/questmaestro-config-contract';

export const mergeConfigsTransformer = ({
  configs,
}: {
  configs: QuestmaestroConfig[];
}): QuestmaestroConfig => {
  if (configs.length === 0) {
    throw new Error('Cannot merge empty configs array');
  }

  const firstConfig = configs[0];
  if (!firstConfig) {
    throw new Error('First config is undefined');
  }

  if (configs.length === 1) {
    return firstConfig;
  }

  // Start with the first config (usually monorepo root)
  const merged = { ...firstConfig };

  // Merge each subsequent config
  for (let i = 1; i < configs.length; i++) {
    const config = configs[i];
    if (!config) {
      continue; // Skip undefined configs
    }

    // Framework from package-specific config always wins
    merged.framework = config.framework;

    // Routing from package-specific config if present
    if (config.routing !== undefined) {
      merged.routing = config.routing;
    }

    // Schema from package-specific config if present
    if (config.schema !== undefined) {
      merged.schema = config.schema;
    }

    // Merge architecture settings
    if (config.architecture) {
      if (!merged.architecture) {
        merged.architecture = {};
      }

      // Merge overrides
      if (config.architecture.overrides) {
        merged.architecture.overrides = {
          ...merged.architecture.overrides,
          ...config.architecture.overrides,
        };
      }

      // Package-specific settings win
      if (config.architecture.allowedRootFiles) {
        merged.architecture.allowedRootFiles = config.architecture.allowedRootFiles;
      }

      if (config.architecture.booleanFunctionPrefixes) {
        merged.architecture.booleanFunctionPrefixes = config.architecture.booleanFunctionPrefixes;
      }
    }
  }

  return merged;
};
