/**
 * PURPOSE: Loads ESLint configuration for a file with caching to improve performance
 *
 * USAGE:
 * const config = await eslintLoadConfigBroker({ cwd: '/project/path', filePath: 'src/file.ts' });
 * // Returns config object for the specified file path
 */
import { eslintEslintAdapter } from '../../../adapters/eslint/eslint/eslint-eslint-adapter';
import { eslintCalculateConfigForFileAdapter } from '../../../adapters/eslint/calculate-config-for-file/eslint-calculate-config-for-file-adapter';
import { pathResolveAdapter } from '../../../adapters/path/resolve/path-resolve-adapter';
import { hasEslintRulesConfigGuard } from '../../../guards/has-eslint-rules-config/has-eslint-rules-config-guard';
import { eslintFallbackPathsBroker } from '../fallback-paths/eslint-fallback-paths-broker';

// Cache the config to avoid repeated expensive loading
// WARNING: This is a module-level cache that persists across function calls.
// This is intentional for performance but creates a potential race condition
// If multiple calls with different cwds happen simultaneously.
// In practice, this is safe for the pre-edit-lint use case since:
// 1. Calls are serialized through the CLI
// 2. The cwd rarely changes during a session
let configCache: { cwd: PropertyKey; config: unknown } | null = null;

export const eslintLoadConfigBroker = async ({
  cwd = process.cwd(),
  filePath,
}: {
  cwd?: string;
  filePath: string;
}): Promise<unknown> => {
  // Return cached config if same cwd
  const currentCache = configCache;
  if (currentCache !== null && currentCache.cwd === cwd) {
    return currentCache.config;
  }

  // Store the cwd we're loading for to check after async operation
  const targetCwd = cwd;

  try {
    const eslint = eslintEslintAdapter({ options: { cwd: targetCwd } });
    let config = await eslintCalculateConfigForFileAdapter({ eslint, filePath });

    // If the file is in an ESLint-ignored path (e.g., .test-tmp), calculateConfigForFile
    // returns an empty config with no rules. Build candidate fallback paths by walking up
    // from cwd, then resolve them all in parallel to find a non-ignored location.
    if (!hasEslintRulesConfigGuard({ config })) {
      const candidatePaths = eslintFallbackPathsBroker({
        cwd: pathResolveAdapter({ paths: [targetCwd] }),
      });

      const candidateConfigs = await Promise.all(
        candidatePaths.map(async (candidate) =>
          eslintCalculateConfigForFileAdapter({ eslint, filePath: candidate }),
        ),
      );

      const matchingConfig = candidateConfigs.find((candidate) =>
        hasEslintRulesConfigGuard({ config: candidate }),
      );

      if (matchingConfig !== undefined) {
        config = matchingConfig;
      }
    }

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
