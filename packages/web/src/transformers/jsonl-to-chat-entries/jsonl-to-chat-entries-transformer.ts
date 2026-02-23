/**
 * PURPOSE: Transforms an array of JSONL history objects into ChatEntry array
 *
 * USAGE:
 * jsonlToChatEntriesTransformer({entries: [{type: 'user', message: {role: 'user', content: 'hello'}}]});
 * // Returns [{role: 'user', content: 'hello'}]
 */
import type { ChatEntry } from '../../contracts/chat-entry/chat-entry-contract';
import { assistantJsonlToChatEntriesTransformer } from '../assistant-jsonl-to-chat-entries/assistant-jsonl-to-chat-entries-transformer';
import { userJsonlToChatEntriesTransformer } from '../user-jsonl-to-chat-entries/user-jsonl-to-chat-entries-transformer';

export const jsonlToChatEntriesTransformer = ({ entries }: { entries: unknown[] }): ChatEntry[] => {
  const result: ChatEntry[] = [];

  for (const entry of entries) {
    if (typeof entry !== 'object' || entry === null || !('type' in entry)) {
      continue;
    }

    const entryType: unknown = Reflect.get(entry, 'type');
    const source: unknown = 'source' in entry ? Reflect.get(entry, 'source') : undefined;
    const validSource = source === 'session' || source === 'subagent' ? source : undefined;
    const rawAgentId: unknown = 'agentId' in entry ? Reflect.get(entry, 'agentId') : undefined;
    const validAgentId =
      typeof rawAgentId === 'string' && rawAgentId.length > 0 ? rawAgentId : undefined;

    if (entryType === 'user') {
      result.push(...userJsonlToChatEntriesTransformer({ entry, validSource, validAgentId }));
      continue;
    }

    if (entryType === 'assistant') {
      result.push(...assistantJsonlToChatEntriesTransformer({ entry, validSource, validAgentId }));
    }
  }

  return result;
};
