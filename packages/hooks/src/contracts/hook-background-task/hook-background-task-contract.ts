/**
 * PURPOSE: One entry of the `background_tasks` array Claude Code delivers on a SubagentStop event —
 * a command the stopping sub-agent backgrounded, and whether it is still out. Reach for this over
 * reading the sub-agent's transcript when the question is "is work still in flight right now": the
 * transcript records that a task was STARTED and never that it finished.
 *
 * USAGE:
 * hookBackgroundTaskContract.parse({ id: 'bcibjy15w', type: 'shell', status: 'running' });
 * // Returns a HookBackgroundTask
 */
import { z } from 'zod';

// `status` and `type` are open branded strings rather than enums, deliberately. The event shape is
// undocumented; a value an enum did not list would be REJECTED, and a rejected parse reads
// downstream as "no background tasks" — failing open and losing the exact run this shape exists to
// protect.
//
// `type` is optional because the wire may omit it, but it is the field that separates the two
// observed kinds and nothing may read this shape without it: `shell` is a backgrounded COMMAND,
// while `subagent` is an AGENT — and an event lists the stopping agent itself under that type, with
// `id` equal to the event's own `agent_id`.
export const hookBackgroundTaskContract = z.object({
  id: z.string().min(1).brand<'HookBackgroundTaskId'>(),
  type: z.string().min(1).brand<'HookBackgroundTaskType'>().optional(),
  status: z.string().min(1).brand<'HookBackgroundTaskStatus'>(),
  description: z.string().brand<'HookBackgroundTaskDescription'>().optional(),
  command: z.string().brand<'HookBackgroundTaskCommand'>().optional(),
});

export type HookBackgroundTask = z.infer<typeof hookBackgroundTaskContract>;
