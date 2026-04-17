/**
 * PURPOSE: Parses a user-type stream JSON object into chat entries, extracting tool_result items and plain text user messages
 *
 * USAGE:
 * parseUserStreamEntryTransformer({parsed: {type: 'user', message: {content: [{type: 'tool_result', tool_use_id: 'id', content: 'data'}]}}});
 * // Returns ChatEntry[] containing tool_result entries and/or user text entries from user messages
 */
import { chatEntryContract } from '@dungeonmaster/shared/contracts';
import type { ChatEntry } from '@dungeonmaster/shared/contracts';
import { mapContentItemToChatEntryTransformer } from '../map-content-item-to-chat-entry/map-content-item-to-chat-entry-transformer';

export const parseUserStreamEntryTransformer = ({ parsed }: { parsed: object }): ChatEntry[] => {
  const message: unknown = 'message' in parsed ? Reflect.get(parsed, 'message') : null;

  if (typeof message !== 'object' || message === null) {
    return [];
  }

  const rawSource: unknown = 'source' in parsed ? Reflect.get(parsed, 'source') : undefined;
  const validSource = rawSource === 'session' || rawSource === 'subagent' ? rawSource : undefined;
  const rawAgentId: unknown = 'agentId' in parsed ? Reflect.get(parsed, 'agentId') : undefined;
  const validAgentId =
    typeof rawAgentId === 'string' && rawAgentId.length > 0 ? rawAgentId : undefined;

  // If the orchestrator already parsed <task-notification> XML on the server side, it attaches
  // the structured fields as `taskNotification` on the line. Build the task_notification
  // ChatEntry directly from those fields — no XML parsing on the web.
  const rawTaskNotification: unknown =
    'taskNotification' in parsed ? Reflect.get(parsed, 'taskNotification') : undefined;
  if (typeof rawTaskNotification === 'object' && rawTaskNotification !== null) {
    const taskId: unknown = Reflect.get(rawTaskNotification, 'taskId');
    const status: unknown = Reflect.get(rawTaskNotification, 'status');
    if (typeof taskId === 'string' && typeof status === 'string') {
      const summary: unknown = Reflect.get(rawTaskNotification, 'summary');
      const result: unknown = Reflect.get(rawTaskNotification, 'result');
      const totalTokens: unknown = Reflect.get(rawTaskNotification, 'totalTokens');
      const toolUses: unknown = Reflect.get(rawTaskNotification, 'toolUses');
      const durationMs: unknown = Reflect.get(rawTaskNotification, 'durationMs');
      const taskEntry = chatEntryContract.safeParse({
        role: 'system',
        type: 'task_notification',
        taskId,
        status,
        ...(typeof summary === 'string' ? { summary } : {}),
        ...(typeof result === 'string' ? { result } : {}),
        ...(typeof totalTokens === 'number' ? { totalTokens } : {}),
        ...(typeof toolUses === 'number' ? { toolUses } : {}),
        ...(typeof durationMs === 'number' ? { durationMs } : {}),
      });
      if (taskEntry.success) {
        return [taskEntry.data];
      }
    }
  }

  const contentArray: unknown = 'content' in message ? Reflect.get(message, 'content') : null;

  if (typeof contentArray === 'string' && contentArray.length > 0) {
    const userEntry = chatEntryContract.safeParse({
      role: 'user',
      content: contentArray,
      ...(validSource ? { source: validSource } : {}),
      ...(validAgentId ? { agentId: validAgentId } : {}),
    });

    return userEntry.success ? [userEntry.data] : [];
  }

  if (!Array.isArray(contentArray)) {
    return [];
  }

  const entries: ChatEntry[] = [];

  for (const item of contentArray) {
    if (
      typeof item === 'object' &&
      item !== null &&
      'type' in item &&
      Reflect.get(item, 'type') === 'tool_result'
    ) {
      const entry = mapContentItemToChatEntryTransformer({
        item: item as never,
        usage: undefined,
        ...(validSource ? { source: validSource } : {}),
        ...(validAgentId ? { agentId: validAgentId } : {}),
      });

      if (entry) {
        entries.push(entry);
      }
    }
  }

  return entries;
};
