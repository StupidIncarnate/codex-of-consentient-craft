/**
 * PURPOSE: The refusal the pre-bash hook feeds back when a session reaches for `git stash`, plus the
 * two subcommands that stay allowed. It sits here rather than inline in the guard so the allow-list
 * and the message that explains it are edited in one place — every refusal in this package names its
 * replacement.
 *
 * USAGE:
 * gitStashBlockStatics.blockMessage;
 * // Returns: the refusal surfaced to the model when it reaches for a stash that moves the tree
 * gitStashBlockStatics.readOnlySubcommands;
 * // Returns: ['list', 'show'] — the stash subcommands that write nothing and are never blocked
 */

export const gitStashBlockStatics = {
  blockMessage: [
    'BLOCKED: `git stash` moves the ENTIRE working tree, not just your files. Other sessions and sub-agents edit this same checkout while you work, so a stash/pop round-trip can swallow or clobber changes you never looked at.',
    'Reading an old version of a file: `git show <rev>:<path>` — it writes nothing to the tree.',
    'Running against a different revision: `mcp__dungeonmaster__create-worktree({ name })`.',
    'Discarding your own edit: `git checkout -- <path>`, naming every path you mean.',
    '`git stash list` and `git stash show` are NOT blocked — inspect an existing stash freely.',
  ].join('\n'),
  readOnlySubcommands: ['list', 'show'],
} as const;
