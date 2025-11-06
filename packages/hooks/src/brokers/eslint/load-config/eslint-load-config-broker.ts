/**
 * PURPOSE: Loads ESLint configuration for a file with caching to improve performance
 *
 * USAGE:
 * const config = await eslintLoadConfigBroker({ cwd: '/project/path', filePath: 'src/file.ts' });
 * // Returns Linter.Config for the specified file path
 */
import { eslintEslintAdapter } from '../../../adapters/eslint/eslint/eslint-eslint-adapter';
import type { Linter } from 'eslint';
import { eslintCalculateConfigForFileAdapter } from '../../../adapters/eslint/calculate-config-for-file/eslint-calculate-config-for-file-adapter';

interface ConfigCache {
  cwd: string;
  config: Linter.Config;
}

// Cache the config to avoid repeated expensive loading
// WARNING: This is a module-level cache that persists across function calls.
// This is intentional for performance but creates a potential race condition
// If multiple calls with different cwds happen simultaneously.
// In practice, this is safe for the pre-edit-lint use case since:
// 1. Calls are serialized through the CLI
// 2. The cwd rarely changes during a session
let configCache: ConfigCache | null = null;

export const eslintLoadConfigBroker = async ({
  cwd = process.cwd(),
  filePath,
}: {
  cwd?: string;
  filePath: string;
}): Promise<Linter.Config> => {
  // Return cached config if same cwd
  const currentCache = configCache;
  if (currentCache !== null && currentCache.cwd === cwd) {
    return currentCache.config;
  }

  // Store the cwd we're loading for to check after async operation
  const targetCwd = cwd;

  try {
    const eslint = eslintEslintAdapter({ options: { cwd: targetCwd } });
    const config = await eslintCalculateConfigForFileAdapter({ eslint, filePath });

    // Only update cache if no other call has changed it
    // This prevents race conditions where parallel calls overwrite each other
    if (configCache === null || configCache.cwd !== targetCwd) {
      configCache = { cwd: targetCwd, config };
    }

    return config;
  } catch (error: unknown) {
    throw new Error(
      `Failed to load ESLint configuration: ${error instanceof Error ? error.message : String(error)}`,
      { cause: error },
    );
  }
};
