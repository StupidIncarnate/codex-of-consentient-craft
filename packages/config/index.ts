/**
 * PURPOSE: Main entry point for @questmaestro/config package
 *
 * USAGE:
 * import { resolveConfigForFile, validateConfig } from '@questmaestro/config';
 * const allowedImports = await resolveConfigForFile({ filePath: '/path/to/file.ts' });
 * const config = validateConfig({ config: rawConfig });
 */

import { configResolveBroker } from './src/brokers/config/resolve/config-resolve-broker';
import { computeAllowedImportsTransformer } from './src/transformers/compute-allowed-imports/compute-allowed-imports-transformer';
import { isValidArchitectureFolderGuard } from './src/guards/is-valid-architecture-folder/is-valid-architecture-folder-guard';
import { questmaestroConfigContract } from './src/contracts/questmaestro-config/questmaestro-config-contract';
import { filePathContract } from '@questmaestro/shared/contracts';
import type { architectureFolderStatics } from './src/statics/architecture-folder/architecture-folder-statics';
import type { Framework } from './src/contracts/framework/framework-contract';
import type { SchemaLibrary } from './src/contracts/schema-library/schema-library-contract';
import type { QuestmaestroConfig } from './src/contracts/questmaestro-config/questmaestro-config-contract';
import type { AllowedExternalImports } from './src/contracts/folder-config/folder-config-contract';
import type { FrameworkPreset } from './src/contracts/framework-presets/framework-presets-contract';

export type ArchitectureFolder =
  typeof architectureFolderStatics.folders.all extends readonly (infer U)[] ? U : never;

/**
 * Main entry point for ESLint rules - resolves config for a specific file
 */
export const resolveConfigForFile = async ({
  filePath,
}: {
  filePath: string;
}): Promise<AllowedExternalImports> => {
  const config = await configResolveBroker({ filePath: filePathContract.parse(filePath) });
  return computeAllowedImportsTransformer({ config });
};

/**
 * Validate a configuration object
 */
export const validateConfig = ({ config }: { config: unknown }): QuestmaestroConfig =>
  questmaestroConfigContract.parse(config);

/**
 * Check if a folder name is valid in the architecture
 */
export const checkArchitectureFolder = (folder: string): folder is ArchitectureFolder =>
  isValidArchitectureFolderGuard({ folder });

// Re-export types for consumers
export type {
  Framework,
  SchemaLibrary,
  QuestmaestroConfig,
  AllowedExternalImports,
  FrameworkPreset
};
