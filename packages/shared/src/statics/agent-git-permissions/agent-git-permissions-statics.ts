/**
 * PURPOSE: The git Bash permissions `dungeonmaster init` grants in `.claude/settings.json` so
 * dispatched relay agents can read history and land their handoff commit.
 *
 * USAGE:
 * agentGitPermissionsStatics.allow;
 * // Returns ['Bash(git status:*)', 'Bash(git log:*)', ...] — the settings.json allow entries
 *
 * A dispatched agent has no interactive approver: the Node dispatcher's headless `claude -p`
 * children (and Task sub-agents under `/dumpster-launch`) get a hard "This command requires
 * approval" denial for anything outside `permissions.allow`, never a prompt. The relay's ONLY
 * handoff channel between sessions is the git commit, so without these entries every
 * file-changing role hits a wall at its commit step.
 *
 * History-rewriting and remote-publishing commands (`stash`, `reset`, `checkout`, `rebase`,
 * `push`) are deliberately absent — agents share one branch and fix forward, so those stay
 * denied.
 */

export const agentGitPermissionsStatics = {
  allow: [
    'Bash(git status:*)',
    'Bash(git log:*)',
    'Bash(git diff:*)',
    'Bash(git show:*)',
    'Bash(git add:*)',
    'Bash(git rm:*)',
    'Bash(git mv:*)',
    'Bash(git commit:*)',
  ],
} as const;
