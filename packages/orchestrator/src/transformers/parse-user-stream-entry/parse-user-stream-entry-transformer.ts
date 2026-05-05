/**
 * PURPOSE: Parses a user-type stream JSON object into chat entries, extracting tool_result items and plain text user messages
 *
 * USAGE:
 * parseUserStreamEntryTransformer({parsed: {type: 'user', message: {content: [{type: 'tool_result', tool_use_id: 'id', content: 'data'}]}}});
 * // Returns ChatEntry[] containing tool_result entries and/or user text entries from user messages.
 * // Every entry carries uuid (`<line-uuid>:<item-index>` for content-array items, `<line-uuid>:user`
 * // for the user-text shorthand, `<line-uuid>:task-notification` for the lifted task_notification)
 * // and timestamp from the source line, so the web binding dedups duplicate dual-source emissions.
 */
import { chatEntryContract } from '@dungeonmaster/shared/contracts';
import type { ChatEntry } from '@dungeonmaster/shared/contracts';
import { normalizedStreamLineContentItemContract } from '../../contracts/normalized-stream-line-content-item/normalized-stream-line-content-item-contract';
import { normalizedStreamLineContract } from '../../contracts/normalized-stream-line/normalized-stream-line-contract';
import { extractTimestampFromJsonlLineTransformer } from '../extract-timestamp-from-jsonl-line/extract-timestamp-from-jsonl-line-transformer';
import { mapContentItemToChatEntryTransformer } from '../map-content-item-to-chat-entry/map-content-item-to-chat-entry-transformer';

export const parseUserStreamEntryTransformer = ({
  parsed,
  lineUuid,
  timestamp,
}: {
  parsed: unknown;
  lineUuid?: string;
  timestamp?: string;
}): ChatEntry[] => {
  const lineParse = normalizedStreamLineContract.safeParse(parsed);
  if (!lineParse.success) {
    return [];
  }
  const line = lineParse.data;
  const { message } = line;
  if (message === undefined) {
    return [];
  }

  const rawLineUuid = line.uuid;
  const resolvedLineUuid =
    typeof lineUuid === 'string' && lineUuid.length > 0
      ? lineUuid
      : typeof rawLineUuid === 'string' && String(rawLineUuid).length > 0
        ? String(rawLineUuid)
        : crypto.randomUUID();
  const resolvedTimestamp =
    typeof timestamp === 'string' && timestamp.length > 0
      ? timestamp
      : String(extractTimestampFromJsonlLineTransformer({ parsed }));

  const rawSource = line.source === undefined ? undefined : String(line.source);
  const validSource: 'session' | 'subagent' | undefined =
    rawSource === 'session' || rawSource === 'subagent' ? rawSource : undefined;
  const rawAgentId = line.agentId;
  const validAgentId =
    typeof rawAgentId === 'string' && String(rawAgentId).length > 0
      ? String(rawAgentId)
      : undefined;

  // If the orchestrator already parsed <task-notification> XML on the server side, it attaches
  // the structured fields as `taskNotification` on the line. Build the task_notification
  // ChatEntry directly from those fields — no XML parsing on the web.
  //
  // The inflated taskNotification carries a `toolUseId` (from the XML's <tool-use-id>) which IS
  // the Task's wire-level agentId after convergence. Stamp it on the entry as `agentId` so the
  // web's chain grouping can pin this notification to its Task by the same key every other
  // sub-agent entry uses. Without this, the entry's `taskId` holds the real internal agentId
  // (from <task-id>) which never matches the chain's toolUseId-based agentId.
  const rawTaskNotification = line.taskNotification;
  if (rawTaskNotification !== undefined) {
    const { taskId } = rawTaskNotification;
    const { status } = rawTaskNotification;
    if (typeof taskId === 'string' && typeof status === 'string') {
      const { summary } = rawTaskNotification;
      const { result } = rawTaskNotification;
      const { totalTokens } = rawTaskNotification;
      const { toolUses } = rawTaskNotification;
      const { durationMs } = rawTaskNotification;
      const notificationToolUseId = rawTaskNotification.toolUseId;
      const notificationAgentId =
        typeof notificationToolUseId === 'string' && String(notificationToolUseId).length > 0
          ? String(notificationToolUseId)
          : validAgentId;
      const taskEntry = chatEntryContract.safeParse({
        role: 'system',
        type: 'task_notification',
        taskId: String(taskId),
        status: String(status),
        ...(typeof summary === 'string' ? { summary: String(summary) } : {}),
        ...(typeof result === 'string' ? { result: String(result) } : {}),
        ...(typeof totalTokens === 'number' ? { totalTokens } : {}),
        ...(typeof toolUses === 'number' ? { toolUses } : {}),
        ...(typeof durationMs === 'number' ? { durationMs } : {}),
        ...(validSource ? { source: validSource } : {}),
        ...(notificationAgentId === undefined ? {} : { agentId: notificationAgentId }),
        uuid: `${resolvedLineUuid}:task-notification`,
        timestamp: resolvedTimestamp,
      });
      if (taskEntry.success) {
        return [taskEntry.data];
      }
    }
  }

  const contentArray = message.content;

  if (typeof contentArray === 'string' && contentArray.length > 0) {
    const userEntry = chatEntryContract.safeParse({
      role: 'user',
      content: contentArray,
      ...(validSource ? { source: validSource } : {}),
      ...(validAgentId ? { agentId: validAgentId } : {}),
      uuid: `${resolvedLineUuid}:user`,
      timestamp: resolvedTimestamp,
    });

    return userEntry.success ? [userEntry.data] : [];
  }

  if (!Array.isArray(contentArray)) {
    return [];
  }

  const entries: ChatEntry[] = [];

  for (let index = 0; index < contentArray.length; index += 1) {
    const rawItem: unknown = contentArray[index];
    const itemParse = normalizedStreamLineContentItemContract.safeParse(rawItem);
    if (!itemParse.success) continue;
    const item = itemParse.data;
    if (item.type !== 'tool_result') continue;

    const entry = mapContentItemToChatEntryTransformer({
      item: rawItem as never,
      usage: undefined,
      ...(validSource ? { source: validSource } : {}),
      ...(validAgentId ? { agentId: validAgentId } : {}),
      uuid: `${resolvedLineUuid}:${String(index)}`,
      timestamp: resolvedTimestamp,
    });

    if (entry) {
      entries.push(entry);
    }
  }

  return entries;
};
