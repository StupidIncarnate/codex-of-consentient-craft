/**
 * PURPOSE: Main entry point for @dungeonmaster/config package
 *
 * USAGE:
 * import { resolveConfigForFile, validateConfig } from '@dungeonmaster/config';
 * const allowedImports = await resolveConfigForFile({ filePath: '/path/to/file.ts' });
 * const config = validateConfig({ config: rawConfig });
 */

import { configResolveBroker } from './src/brokers/config/resolve/config-resolve-broker';
import { computeAllowedImportsTransformer } from './src/transformers/compute-allowed-imports/compute-allowed-imports-transformer';
import { dungeonmasterConfigContract } from './src/contracts/dungeonmaster-config/dungeonmaster-config-contract';
import { filePathContract } from '@dungeonmaster/shared/contracts';
import type { DungeonmasterConfig } from './src/contracts/dungeonmaster-config/dungeonmaster-config-contract';
import type { DevServerE2eProcess } from './src/contracts/dev-server-e2e-process/dev-server-e2e-process-contract';
import type { AllowedExternalImports } from './src/contracts/folder-config/folder-config-contract';
import type { FrameworkPreset } from './src/contracts/framework-presets/framework-presets-contract';

export { configResolveBroker };
export { DungeonmasterConfigStub } from './src/contracts/dungeonmaster-config/dungeonmaster-config.stub';
export { DevServerE2eProcessStub } from './src/contracts/dev-server-e2e-process/dev-server-e2e-process.stub';
export { configDefaultsStatics } from './src/statics/config-defaults/config-defaults-statics';
export { e2eProcessPlaceholderStatics } from './src/statics/e2e-process-placeholder/e2e-process-placeholder-statics';

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
export const validateConfig = ({ config }: { config: unknown }): DungeonmasterConfig =>
  dungeonmasterConfigContract.parse(config);

// Re-export types for consumers
export type { DungeonmasterConfig, DevServerE2eProcess, AllowedExternalImports, FrameworkPreset };
