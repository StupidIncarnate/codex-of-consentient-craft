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
 * callerRepoRootBannerTransformer({ repoRoot: '/repo', source: 'caller-cwd', configFound: true });
 * // Returns ContentText, e.g. "[project-root: /repo — resolved from the caller's own working directory]"
 */

import type { CallerRepoRootSource } from '../../contracts/caller-repo-root-source/caller-repo-root-source-contract';

export const callerRepoRootBannerTransformer = ({
  repoRoot,
  source,
  configFound,
}: {
  repoRoot: string;
  source: CallerRepoRootSource;
  configFound: boolean;
}): string => {
  const locationClause =
    source === 'server-cwd-fallback'
      ? 'WARNING: the MCP call carried no caller context from the dungeonmaster-pre-mcp-caller ' +
        "hook (run `dungeonmaster init` to install it); falling back to the MCP server's own " +
        'startup directory. If the caller is working in a worktree, this result may describe ' +
        'the WRONG tree.'
      : "resolved from the caller's own working directory";

  const configClause = configFound
    ? ''
    : ' WARNING: no .dungeonmaster.json was found anywhere above that path — this is the ' +
      'literal starting directory, not a confirmed dungeonmaster project root.';

  return `[project-root: ${repoRoot} — ${locationClause}${configClause}]`;
};
