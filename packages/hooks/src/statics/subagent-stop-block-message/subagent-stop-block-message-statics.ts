/**
 * PURPOSE: Message the SubagentStop hook feeds back to a work-item sub-agent that tries to end its turn without calling signal-back, forcing it to finish the turn instead of stranding its work item
 *
 * USAGE:
 * subagentStopBlockMessageStatics.blockMessage;
 * // Returns: the reason string surfaced to the sub-agent when its stop is blocked
 */

export const subagentStopBlockMessageStatics = {
  blockMessage:
    'You are ending your turn without calling signal-back, but your work item is still in_progress. If a helper or a backgrounded command is still out, ignore this: end your turn again and its notification will re-enter you. Otherwise you have nothing left coming, and a work-item sub-agent that stops there strands its work item until orphan recovery reclaims it, holding the whole quest behind it. Call mcp__dungeonmaster__signal-back now with signal "complete" — that is the only signal kind, and the outcome rides on operationStatus: "done" when the work is finished and verified, or "blocked" with a blockedReason naming the wall when the environment stopped you. Then stop.',
} as const;
