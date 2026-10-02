/**
 * PURPOSE: Builds the ignore list every discover scan runs against, folding the repo's own
 * .gitignore over the always-on static rules so untracked scratch (tmp/, worktrees/) stays out of
 * unscoped searches. Called once from MCP startup and cached in discoverIgnoreState — nothing
 * downstream re-reads .gitignore, so a search costs no file operation to know what to skip.
 *
 * If .gitignore is not found directly, walks up parent directories via
 * discoverIgnoreInitWalkUpLayerBroker to locate the enclosing repository's .gitignore.
 *
 * The static rules lead the merge and survive it: node_modules and dist must be skipped whether or
 * not a given repo bothers to gitignore them.
 *
 * USAGE:
 * const patterns = await discoverIgnoreInitBroker({ startPath });
 * // Returns the deduped union, or just the static rules when the repo keeps no .gitignore
 */

import { fileDiscoveryStatics } from '../../../statics/file-discovery/file-discovery-statics';
import { gitignoreToGlobTransformer } from '../../../transformers/gitignore-to-glob/gitignore-to-glob-transformer';
import { discoverIgnoreInitWalkUpLayerBroker } from './discover-ignore-init-walk-up-layer-broker';

export const discoverIgnoreInitBroker = async ({
  startPath,
}: {
  startPath?: string;
} = {}): Promise<readonly string[]> => {
  const staticPatterns = fileDiscoveryStatics.globIgnorePatterns.map((pattern) => pattern);

  const contents = await discoverIgnoreInitWalkUpLayerBroker({
    startPath: startPath ?? '.',
  });

  if (contents === null) {
    return staticPatterns;
  }

  // A branded pattern is a plain string at runtime, so the Set dedups by pattern text — which is
  // what keeps a rule both lists carry (`dist` is routinely in both) from compiling twice in glob.
  return [...new Set([...staticPatterns, ...gitignoreToGlobTransformer({ contents })])];
};
