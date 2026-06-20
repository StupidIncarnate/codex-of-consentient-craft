/**
 * PURPOSE: Message the SubagentStop hook feeds back to a work-item sub-agent that tries to end its turn without calling signal-back, forcing it to finish the turn instead of stranding its work item
 *
 * USAGE:
 * subagentStopBlockMessageStatics.blockMessage;
 * // Returns: the reason string surfaced to the sub-agent when its stop is blocked
 */

export const subagentStopBlockMessageStatics = {
  blockMessage:
    'You are ending your turn without calling signal-back, but your work item is still in_progress. A work-item sub-agent that stops without signalling strands its work item forever and wedges the whole quest behind it — there is no async wakeup and no auto-retry. Call mcp__dungeonmaster__signal-back now with signal "complete" (the work is done and verified) or "failed" (you are genuinely blocked), then stop.',
} as const;
