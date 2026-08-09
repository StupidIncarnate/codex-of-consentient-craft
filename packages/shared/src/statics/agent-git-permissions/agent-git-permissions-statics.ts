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
 * `checkout` and `merge` are granted because the `warpgate` merge role cannot do its job without
 * them: it merges the base branch into the quest branch inside the quest's worktree, then brings
 * the repo root checkout onto the base branch and merges the quest branch in there. Permissions
 * live in one settings file applied per session and there is no per-role scoping mechanism, so
 * this grant is visible to every dispatched role, not just warpgate. That is accepted: each quest
 * now works in its OWN git worktree, so a stray checkout by another role happens inside that
 * quest's tree and cannot disturb the base branch or another quest.
 *
 * `stash`, `reset`, `rebase`, and `push` stay denied for everyone — agents fix forward and never
 * rewrite or publish history. `git worktree` is NOT granted: worktrees are created by the server
 * at Start, not by any agent.
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
    'Bash(git checkout:*)',
    'Bash(git merge:*)',
  ],
} as const;
