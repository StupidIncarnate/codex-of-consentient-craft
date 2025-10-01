import type { QuestmaestroConfig } from '../../contracts/questmaestro-config/questmaestro-config-contract';

const mergeArchitecture = ({
  merged,
  config,
}: {
  merged: QuestmaestroConfig;
  config: QuestmaestroConfig;
}): void => {
  if (!config.architecture) {
    return;
  }

  merged.architecture ??= {};

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
};

export const mergeConfigsTransformer = ({
  configs,
}: {
  configs: QuestmaestroConfig[];
}): QuestmaestroConfig => {
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
    mergeArchitecture({ merged, config });
  }

  return merged;
};
