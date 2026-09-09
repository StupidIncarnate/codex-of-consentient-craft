/**
 * PURPOSE: The two `background_tasks[]` field values that decide whether a stopping sub-agent is
 * leaving real work behind. Reach for these rather than writing either literal at a comparison site:
 * the SubagentStop event is undocumented, so this is the single place to widen if Claude Code ever
 * reports a second live status or a second command-shaped type.
 *
 * USAGE:
 * hookBackgroundTaskStatics.type.shell;
 * // Returns: 'shell'
 */

export const hookBackgroundTaskStatics = {
  status: {
    running: 'running',
  },
  // `shell` is a backgrounded COMMAND. The other observed type is `subagent`, and an event lists the
  // stopping agent ITSELF under that type, with `id` equal to the event's own `agent_id` — so a
  // check that ignored `type` would block every async-dispatched sub-agent on an entry it can never
  // clear. A `subagent` entry is also a helper, whose notification re-enters its parent, which is a
  // different mechanic and safe to stop on.
  type: {
    shell: 'shell',
  },
} as const;
