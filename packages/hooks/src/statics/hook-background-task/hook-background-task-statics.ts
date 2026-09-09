/**
 * PURPOSE: The `background_tasks[].status` value that means a task is still out. Reach for this
 * rather than writing the literal at a comparison site: the SubagentStop event is undocumented, so
 * this is the single place to widen if Claude Code ever reports a second live status.
 *
 * USAGE:
 * hookBackgroundTaskStatics.status.running;
 * // Returns: 'running'
 */

export const hookBackgroundTaskStatics = {
  status: {
    running: 'running',
  },
} as const;
