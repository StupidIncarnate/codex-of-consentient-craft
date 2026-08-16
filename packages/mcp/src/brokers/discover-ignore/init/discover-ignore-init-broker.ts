/**
 * PURPOSE: Builds the ignore list every discover scan runs against, folding the repo's own
 * .gitignore over the always-on static rules so untracked scratch (tmp/, worktrees/) stays out of
 * unscoped searches. Called once from MCP startup and cached in discoverIgnoreState — nothing
 * downstream re-reads .gitignore, so a search costs no file operation to know what to skip.
 *
 * The static rules lead the merge and survive it: node_modules and dist must be skipped whether or
 * not a given repo bothers to gitignore them.
 *
 * USAGE:
 * const patterns = await discoverIgnoreInitBroker();
 * // Returns the deduped union, or just the static rules when the repo keeps no .gitignore
 */

import { globPatternContract, pathSegmentContract } from '@dungeonmaster/shared/contracts';
import type { GlobPattern } from '@dungeonmaster/shared/contracts';
import { fsReadFileIfExistsAdapter } from '../../../adapters/fs/read-file-if-exists/fs-read-file-if-exists-adapter';
import { fileDiscoveryStatics } from '../../../statics/file-discovery/file-discovery-statics';
import { gitignoreToGlobTransformer } from '../../../transformers/gitignore-to-glob/gitignore-to-glob-transformer';

// Deliberately relative: fs resolves it against process.cwd(), which is the same scan root
// fileScannerBroker globs from, so the .gitignore read and the scan can never disagree about which
// repo they mean. Resolving it through cwd + path adapters here would pull
// '@dungeonmaster/shared/testing' into this broker's proxy, and that barrel's re-exported path
// proxies hoist jest.mock('path') across the whole test file — stubbing out the real path.resolve
// folderConstraintsInitBroker needs under the same startup responder.
const GITIGNORE_FILENAME = '.gitignore';

export const discoverIgnoreInitBroker = async (): Promise<readonly GlobPattern[]> => {
  const staticPatterns = fileDiscoveryStatics.globIgnorePatterns.map((pattern) =>
    globPatternContract.parse(pattern),
  );

  const contents = await fsReadFileIfExistsAdapter({
    filepath: pathSegmentContract.parse(GITIGNORE_FILENAME),
  });

  if (contents === undefined) {
    return staticPatterns;
  }

  // A branded pattern is a plain string at runtime, so the Set dedups by pattern text — which is
  // what keeps a rule both lists carry (`dist` is routinely in both) from compiling twice in glob.
  return [...new Set([...staticPatterns, ...gitignoreToGlobTransformer({ contents })])];
};
