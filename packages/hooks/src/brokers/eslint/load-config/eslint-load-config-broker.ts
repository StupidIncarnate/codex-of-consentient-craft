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
import { fsExistsSyncAdapter } from '../../../adapters/fs/exists-sync/fs-exists-sync-adapter';
import type { FilePath } from '../../../contracts/file-path/file-path-contract';
import { hasEslintRulesConfigGuard } from '../../../guards/has-eslint-rules-config/has-eslint-rules-config-guard';
import { eslintFallbackPathsBroker } from '../fallback-paths/eslint-fallback-paths-broker';
import { processCwdAdapter } from '@dungeonmaster/shared/adapters';
import { locationsStatics } from '@dungeonmaster/shared/statics';

// Cache keyed by resolved eslint.config.* path (or cwd when no config is found). Many cwds
// can resolve to the same config file, so this lets unrelated callers share a cache entry.
const configCache = new Map<FilePath, unknown>();

const MAX_WALK_UP_DEPTH = 20;

export const eslintLoadConfigBroker = async ({
  cwd = processCwdAdapter(),
  filePath,
}: {
  cwd?: string;
  filePath: string;
}): Promise<unknown> => {
  const targetCwd = cwd;
  const resolvedCwd = pathResolveAdapter({ paths: [targetCwd] });

  let cacheKey: FilePath = resolvedCwd;
  let walkDir: FilePath = resolvedCwd;
  for (let depth = 0; depth < MAX_WALK_UP_DEPTH; depth++) {
    const currentDir = walkDir;
    const candidates = locationsStatics.repoRoot.eslintConfig.map((name) =>
      pathResolveAdapter({ paths: [currentDir, name] }),
    );
    const found = candidates.find((candidate) => fsExistsSyncAdapter({ filePath: candidate }));
    if (found !== undefined) {
      cacheKey = found;
      break;
    }
    const parentDir = pathResolveAdapter({ paths: [walkDir, '..'] });
    if (parentDir === walkDir) {
      break;
    }
    walkDir = parentDir;
  }

  const cached = configCache.get(cacheKey);
  if (cached !== undefined) {
    return cached;
  }

  try {
    const eslint = eslintEslintAdapter({ options: { cwd: targetCwd } });
    let config = await eslintCalculateConfigForFileAdapter({ eslint, filePath });

    // If the file is in an ESLint-ignored path (e.g., .test-tmp), calculateConfigForFile
    // returns an empty config with no rules. Build candidate fallback paths by walking up
    // from cwd, then resolve them all in parallel to find a non-ignored location.
    if (!hasEslintRulesConfigGuard({ config })) {
      const candidatePaths = eslintFallbackPathsBroker({ cwd: resolvedCwd });

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

    configCache.set(cacheKey, config);

    return config;
  } catch (error: unknown) {
    throw new Error(
      `Failed to load ESLint configuration: ${error instanceof Error ? error.message : String(error)}`,
      { cause: error },
    );
  }
};
