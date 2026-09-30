/**
 * PURPOSE: Loads ESLint configuration for a file with caching to improve performance
 *
 * USAGE:
 * const config = await eslintLoadConfigBroker({ cwd: '/project/path', filePath: 'src/file.ts' });
 * // Returns config object for the specified file path
 */
import { ESLint } from '#gateway/npm/eslint';
import { resolve } from '#gateway/node/path';
import { existsSync } from '#gateway/node/fs';
import { hasEslintRulesConfigGuard } from '../../../guards/has-eslint-rules-config/has-eslint-rules-config-guard';
import { eslintFallbackPathsBroker } from '../fallback-paths/eslint-fallback-paths-broker';
import { cwd } from '#gateway/node/process';
import { locationsStatics } from '@dungeonmaster/shared/statics';

// Cache keyed by resolved eslint.config.* path (or cwd when no config is found). Many cwds
// can resolve to the same config file, so this lets unrelated callers share a cache entry.
const configCache = new Map<string, unknown>();

const MAX_WALK_UP_DEPTH = 20;

export const eslintLoadConfigBroker = async ({
  cwd: customCwd,
  filePath,
}: {
  cwd?: string;
  filePath: string;
}): Promise<unknown> => {
  const targetCwd = customCwd ?? cwd();
  const resolvedCwd = resolve(targetCwd);

  let cacheKey: string = resolvedCwd;
  let walkDir: string = resolvedCwd;
  for (let depth = 0; depth < MAX_WALK_UP_DEPTH; depth++) {
    const currentDir = walkDir;
    const candidates = locationsStatics.repoRoot.eslintConfig.map((name) =>
      resolve(currentDir, name),
    );
    const found = candidates.find((candidate) => existsSync(candidate));
    if (found !== undefined) {
      cacheKey = found;
      break;
    }
    const parentDir = resolve(walkDir, '..');
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
    const eslint = new ESLint({ cwd: targetCwd });
    const rawConfig: unknown = await eslint.calculateConfigForFile(filePath);
    let config: unknown = rawConfig ?? {};

    // If the file is in an ESLint-ignored path (e.g., .test-tmp), calculateConfigForFile
    // returns an empty config with no rules. Build candidate fallback paths by walking up
    // from cwd, then resolve them all in parallel to find a non-ignored location.
    if (!hasEslintRulesConfigGuard({ config })) {
      const candidatePaths = eslintFallbackPathsBroker({ cwd: resolvedCwd });

      const candidateConfigs: unknown[] = await Promise.all(
        candidatePaths.map(async (candidate): Promise<unknown> => {
          const candidateConfig: unknown = await eslint.calculateConfigForFile(candidate);
          return candidateConfig ?? {};
        }),
      );

      const matchingConfig: unknown = candidateConfigs.find((candidate) =>
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
