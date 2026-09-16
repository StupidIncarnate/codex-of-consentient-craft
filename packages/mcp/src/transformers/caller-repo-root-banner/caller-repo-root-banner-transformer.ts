/**
 * PURPOSE: Renders the one-line banner every discover/get-project-map/get-project-inventory
 * response carries, naming the resolved project root and how it was resolved. Two independent
 * facts can each go wrong and must each say so on their own, never blended into one silent
 * success line: `source: 'server-cwd-fallback'` means the caller's own location could not be
 * identified (see callerRepoRootResolveBroker) and the MCP server's own startup cwd was used
 * instead; `configFound: false` means the config walk-up (cwdResolveBroker) never found a
 * `.dungeonmaster.json` above WHICHEVER path it started from and fell back to that literal path —
 * this can happen even when the caller's own location WAS correctly identified (a sub-agent
 * working in a scratch dir with no dungeonmaster config above it), so a caller-cwd success does
 * NOT imply a found config, and the banner says so rather than reading like a clean resolution.
 *
 * USAGE:
 * callerRepoRootBannerTransformer({ repoRoot: RepoRootCwdStub(), source: 'caller-cwd', configFound: true });
 * // Returns ContentText, e.g. "[project-root: /repo — resolved from the caller's own working directory]"
 */

import type { RepoRootCwd } from '@dungeonmaster/shared/contracts';

import { contentTextContract } from '../../contracts/content-text/content-text-contract';
import type { ContentText } from '../../contracts/content-text/content-text-contract';
import type { CallerRepoRootSource } from '../../contracts/caller-repo-root-source/caller-repo-root-source-contract';

export const callerRepoRootBannerTransformer = ({
  repoRoot,
  source,
  configFound,
}: {
  repoRoot: RepoRootCwd;
  source: CallerRepoRootSource;
  configFound: boolean;
}): ContentText => {
  const locationClause =
    source === 'server-cwd-fallback'
      ? "WARNING: could not resolve the caller's own working directory (no matching Claude " +
        "Code session JSONL within the scan budget); falling back to the MCP server's own " +
        'startup directory. If the caller is working in a worktree, this result may describe ' +
        'the WRONG tree.'
      : "resolved from the caller's own working directory";

  const configClause = configFound
    ? ''
    : ' WARNING: no .dungeonmaster.json was found anywhere above that path — this is the ' +
      'literal starting directory, not a confirmed dungeonmaster project root.';

  return contentTextContract.parse(
    `[project-root: ${String(repoRoot)} — ${locationClause}${configClause}]`,
  );
};
