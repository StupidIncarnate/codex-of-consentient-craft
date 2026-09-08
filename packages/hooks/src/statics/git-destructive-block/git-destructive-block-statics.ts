/**
 * PURPOSE: The refusal the pre-bash hook feeds back when a session reaches for a git verb that
 * discards or rewrites work on a shared checkout. Reach for this over `agentGitPermissionsStatics`,
 * which decides what `.claude/settings.json` GRANTS: a verb can be granted there and still refused
 * here, which is how `git checkout <branch>` stays open for the merge role while
 * `git checkout -- <path>` does not.
 *
 * USAGE:
 * gitDestructiveBlockStatics.blockMessage;
 * // Returns the refusal, naming the allowed form of every blocked verb and what to run instead
 */

export const gitDestructiveBlockStatics = {
  blockMessage: [
    'BLOCKED: this git command discards or rewrites work on a checkout that other sessions and sub-agents are editing right now. What it takes is invisible to them until it is already gone.',
    '',
    'git stash    — `git stash list` and `git stash show` are fine. To read an old version of a file: `git show <rev>:<path>`. To work against another revision: `mcp__dungeonmaster__create-worktree({ name })`.',
    'git reset    — bare `git reset`, with no argument, is fine. To unstage one path: `git restore --staged <path>`. To undo a commit that is already pushed: commit the correction on top of it.',
    'git clean    — `git clean -n` is fine. To remove a file you created yourself: delete that one path by name.',
    'git rebase   — `git rebase --abort` is fine. To bring base changes into this branch: `git merge <base branch>`.',
    'git checkout — switching or creating a branch is fine. Only the `-- <path>` form and a bare `.` are blocked.',
    'git restore  — `git restore --staged <path>` is fine. Restoring the working tree is not.',
    '',
    'Undoing your OWN edit: edit the file back with Edit, so what you reverse is visible to the session that reviews it.',
  ].join('\n'),
} as const;
