// Public API for @questmaestro/config library
import { configResolveBroker } from '../brokers/config/resolve/config-resolve-broker';
import { computeAllowedImportsTransformer } from '../transformers/compute-allowed-imports/compute-allowed-imports-transformer';
import { FRAMEWORK_PRESETS } from '../contracts/framework-presets/framework-presets';
import { ALL_FRAMEWORKS, isValidFramework } from '../contracts/framework/framework-contract';
import { ALL_SCHEMA_LIBRARIES } from '../contracts/schema-library/schema-library-contract';
import { isValidArchitectureFolder as checkValidArchitectureFolder } from '../contracts/folder-config/folder-config-contract';
import type { Framework } from '../contracts/framework/framework-contract';
import type { SchemaLibrary } from '../contracts/schema-library/schema-library-contract';
import type { QuestmaestroConfig } from '../contracts/questmaestro-config/questmaestro-config-contract';
import type {
  AllowedExternalImports,
  ArchitectureFolder,
} from '../contracts/folder-config/folder-config-contract';
import type { FrameworkPreset } from '../contracts/framework-presets/framework-presets';

/**
 * Main entry point for ESLint rules - resolves config for a specific file
 */
export const resolveConfigForFile = async ({
  filePath,
}: {
  filePath: string;
}): Promise<AllowedExternalImports> => {
  const config = await configResolveBroker({ filePath });
  return computeAllowedImportsTransformer({ config });
};

/**
 * Get the preset configuration for a framework
 */
export const getFrameworkPreset = ({ framework }: { framework: Framework }): FrameworkPreset =>
  FRAMEWORK_PRESETS[framework];

/**
 * Validate a configuration object
 */
export const validateConfig = ({ config }: { config: unknown }): QuestmaestroConfig => {
  if (!config || typeof config !== 'object') {
    throw new Error('Config must be an object');
  }

  const configObj = config as Record<string, unknown>;

  if (!configObj.framework || !isValidFramework(configObj.framework)) {
    throw new Error('Config must specify a valid framework');
  }

  if (!configObj.schema) {
    throw new Error('Config must specify schema library/libraries');
  }

  return config as QuestmaestroConfig;
};

/**
 * Get list of all valid frameworks
 */
export const getAllFrameworks = (): readonly Framework[] => ALL_FRAMEWORKS;

/**
 * Get list of all valid schema libraries
 */
export const getAllSchemaLibraries = (): readonly SchemaLibrary[] => ALL_SCHEMA_LIBRARIES;

/**
 * Check if a folder name is valid in the architecture
 */
export const checkArchitectureFolder = (folder: string): folder is ArchitectureFolder =>
  checkValidArchitectureFolder(folder);

// Re-export types for consumers
export type {
  Framework,
  SchemaLibrary,
  QuestmaestroConfig,
  AllowedExternalImports,
  FrameworkPreset,
};
