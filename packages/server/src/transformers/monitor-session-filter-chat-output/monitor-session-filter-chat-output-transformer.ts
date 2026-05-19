/**
 * PURPOSE: Wraps filterParentSourceEntriesTransformer with a chatProcessId-prefix gate so the parent-source dispatcher filter only applies to /dumpster-launch monitor-session chat-output (chatProcessId prefix `proc-monitor-`), and not to legacy chat-spawn-broker (`chat-`/`design-`), replay paths (`replay-`/`quest-replay-`), or orchestration-loop agents (`proc-`) whose session-source text/user-message entries ARE the user-facing content.
 *
 * USAGE:
 * const result = monitorSessionFilterChatOutputTransformer({ payload, payloadChatProcessId, monitorTaskToolUseIds });
 * // Returns: { payload: nextPayload } when broadcast should proceed, or null when the entire batch was dispatcher chatter and the broadcast should be skipped.
 */

import type { ProcessId } from '@dungeonmaster/shared/contracts';

import type { ToolName } from '../../contracts/tool-name/tool-name-contract';
import { filterParentSourceEntriesTransformer } from '../filter-parent-source-entries/filter-parent-source-entries-transformer';
import { parseChatOutputEntriesTransformer } from '../parse-chat-output-entries/parse-chat-output-entries-transformer';

const MONITOR_SESSION_CHAT_PROCESS_PREFIX = 'proc-monitor-';

export const monitorSessionFilterChatOutputTransformer = ({
  payload,
  payloadChatProcessId,
  monitorTaskToolUseIds,
}: {
  payload: Record<PropertyKey, unknown>;
  payloadChatProcessId: ProcessId | undefined;
  monitorTaskToolUseIds: Set<ToolName>;
}): { payload: Record<PropertyKey, unknown> } | null => {
  if (payloadChatProcessId === undefined) return { payload };
  if (!payloadChatProcessId.startsWith(MONITOR_SESSION_CHAT_PROCESS_PREFIX)) return { payload };

  const originalEntries = parseChatOutputEntriesTransformer({ payload });
  if (originalEntries.length === 0) return { payload };

  const filtered = filterParentSourceEntriesTransformer({
    entries: originalEntries,
    taskToolUseIds: monitorTaskToolUseIds,
  });
  if (filtered.length === 0) return null;
  if (filtered.length === originalEntries.length) return { payload };
  return { payload: { ...payload, entries: filtered } };
};
