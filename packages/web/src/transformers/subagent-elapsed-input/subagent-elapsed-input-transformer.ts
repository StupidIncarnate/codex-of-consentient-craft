/**
 * PURPOSE: Gathers the raw timestamps a sub-agent chain's duration figure is computed from —
 * the Task tool-use's own timestamp, the completion notification's timestamp and reported
 * duration (if either arrived), and the panel's live clock reading (if the caller is still
 * ticking) — into one `SubagentElapsedInput`. Returns null for a chain with no start at all,
 * so `subagentDurationLabelTransformer` never has to special-case a missing timestamp itself.
 *
 * USAGE:
 * subagentElapsedInputTransformer({ group: subagentChainGroup, now: currentIsoTimestamp });
 * // Returns a SubagentElapsedInput, or null when kind !== 'subagent-chain' or taskToolUse is null
 */

import type { IsoTimestamp } from '../../contracts/iso-timestamp/iso-timestamp-contract';
import { subagentElapsedInputContract } from '../../contracts/subagent-elapsed-input/subagent-elapsed-input-contract';
import type { SubagentElapsedInput } from '../../contracts/subagent-elapsed-input/subagent-elapsed-input-contract';
import type { ChatEntryGroup } from '../../contracts/chat-entry-group/chat-entry-group-contract';

export const subagentElapsedInputTransformer = ({
  group,
  now,
}: {
  group: ChatEntryGroup;
  now?: IsoTimestamp;
}): SubagentElapsedInput | null => {
  if (group.kind !== 'subagent-chain') return null;

  const { taskToolUse, taskNotification } = group;
  if (taskToolUse === null) return null;

  // `taskNotification` is the WHOLE ChatEntry union. `role === 'system' && type ===
  // 'task_notification'` narrows out the `user` member (which carries no `type` at all) before
  // `durationMs` — which lives only on this one variant — becomes readable.
  const reportedDurationMs =
    taskNotification !== null &&
    taskNotification.role === 'system' &&
    taskNotification.type === 'task_notification'
      ? taskNotification.durationMs
      : undefined;

  return subagentElapsedInputContract.parse({
    startedAt: taskToolUse.timestamp,
    ...(taskNotification === null ? {} : { endedAt: taskNotification.timestamp }),
    ...(reportedDurationMs === undefined ? {} : { reportedDurationMs }),
    ...(now === undefined ? {} : { clockReading: now }),
  });
};
