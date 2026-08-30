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
 * `push` is granted because a `<role>-reviewer` pushes once at the end of every pass, as
 * the last thing it does. Riftcarver published the branch itself at carve time, so what each of
 * these pushes lands is that pass's own commit — the only way the pass leaves the worktree.
 * Denied, the reviewer reads its own prompt's mandated step coming back `This command requires
 * approval`, which its `[WALL]` operating rule defines as an environment wall; the most COMPLIANT
 * reading of that denial is `NEXT: wall`, its operator turns that into an
 * `operationStatus: 'blocked'`, and the first pass of the first operator item halts the quest.
 * Publishing the quest's own branch is not history rewriting: it is how the relay hands work
 * forward, exactly as the commit is.
 *
 * `stash`, `reset` and `rebase` stay denied for everyone — those DISCARD or REWRITE work on a
 * branch several sessions share, and the operator that would have to notice cannot open a file to
 * see what went missing. `git worktree` is NOT granted: worktrees are created by the server at
 * Start, not by any agent.
 *
 * `rev-parse` and `merge-base` are granted because a dispatched session routinely needs to resolve
 * a REF rather than read a diff — a `codeweaver-reviewer` / `flowrider-reviewer` / `siegemaster-reviewer`
 * pass reading "git log with bodies on this branch" reaches for `git rev-parse @{upstream}` to find
 * where an earlier pass's own work starts (measured directly: four reviewer passes on one audited
 * quest hit `This command requires approval` on that exact call and fell back to the poorer
 * `git status -sb`), and `warpgate`'s own step 1 — "check whether the base branch tip is already an
 * ancestor of the quest branch" — is a description of `git merge-base --is-ancestor` with no other
 * idiomatic command to run instead. Both are READ-ONLY: neither creates, deletes nor moves a ref,
 * so granting them opens no path to rewriting history that `rev-parse`/`merge-base` alone could
 * take. `merge-base` is its own entry rather than assumed to ride in under `Bash(git merge:*)`'s
 * prefix — relying on that ambiguity would leave the grant dependent on exactly how the matcher
 * treats the shared "git merge" substring, and a dedicated read-only entry settles it outright at
 * zero additional risk.
 *
 * `git -C <path> ...` is DELIBERATELY not granted, in any form, despite a real denial (a worker
 * sub-agent's `git -C <abs path> status --porcelain`). Claude Code's Bash permission matcher is
 * prefix-based on the command STRING, so `Bash(git -C:*)` would authorise `git -C <any path> reset
 * --hard` or `git -C <any path> push --force` just as readily as the `status` call that was denied —
 * it would silently defeat every denial and every worktree boundary this whole list exists to keep.
 * There is also no narrower fix here: the `-C` target is a quest worktree path minted fresh per
 * quest, so no literal path can be pinned into an allow entry. Every dispatched session already runs
 * with its cwd set to the correct worktree, so `-C` is never actually necessary — the fix for that
 * denial is telling sub-agents so in their briefs, not widening this list.
 *
 * A COMPOUND command (`git log ... && git diff ... | head`) is also not fixable from this list. Each
 * entry here is a prefix match on a single simple command; a `&&`/`|` chain is a different string
 * whose second half is not a git invocation at all in the measured denial (`| head`), so no entry a
 * git-permissions file could add authorises the chain as a whole. The fix, where there is one, is
 * bounding the FIRST command with git's own flags (`git log -n 15`, `git diff --stat`) instead of
 * piping to a second, ungranted program — a prompt change, not a permission one.
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
    'Bash(git rev-parse:*)',
    'Bash(git merge-base:*)',
  ],
} as const;
