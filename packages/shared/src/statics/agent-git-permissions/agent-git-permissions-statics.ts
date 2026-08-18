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
 * `push` is granted because an OPERATOR pushes once per round at its gate 9, and the whole
 * review-scope design rests on that push landing: a `reviewer-minion` measures its round with
 * `get-blight-checklist({ scope: 'unpushed' })` — `@{upstream}..HEAD` — so an unpushed round is a
 * round the NEXT reviewer reads as its own. Denied, the operator reads its own prompt's mandated
 * step coming back `This command requires approval`, which its Operating Rule 5 defines as an
 * environment wall — so the most COMPLIANT reading of a denial turns the first round of the first
 * operator item into an `operationStatus: 'blocked'` and halts the quest. Publishing the quest's
 * own branch is not history rewriting: it is how the relay hands work forward, exactly as the
 * commit is.
 *
 * `stash`, `reset` and `rebase` stay denied for everyone — those DISCARD or REWRITE work on a
 * branch several sessions share, and the operator that would have to notice cannot open a file to
 * see what went missing. `git worktree` is NOT granted: worktrees are created by the server at
 * Start, not by any agent.
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
    'Bash(git push:*)',
  ],
} as const;
