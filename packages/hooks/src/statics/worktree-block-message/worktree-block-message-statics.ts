/**
 * PURPOSE: Message the WorktreeCreate hook feeds back when it refuses Claude Code's own worktree
 * path, naming the one tool that produces a usable tree. It sits here rather than inline in the
 * responder so the pre-bash hook's blocked-command messages and this one are edited in the same
 * place and read alike — every refusal in this package names its replacement.
 *
 * USAGE:
 * worktreeBlockMessageStatics.blockMessage;
 * // Returns: the refusal surfaced to the model when it reaches for Claude Code's worktree command
 */

export const worktreeBlockMessageStatics = {
  blockMessage:
    'Worktrees are created with `mcp__dungeonmaster__create-worktree({ name })`. It puts them under `worktrees/`.',
} as const;
