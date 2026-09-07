/**
 * PURPOSE: Proxy for hook-worktree-create-responder. Empty: the responder reaches no I/O boundary
 * at all — refusing a worktree spawns nothing, reads nothing and writes nothing.
 *
 * USAGE:
 * HookWorktreeCreateResponderProxy();
 */

export const HookWorktreeCreateResponderProxy = (): Record<PropertyKey, never> => ({});
