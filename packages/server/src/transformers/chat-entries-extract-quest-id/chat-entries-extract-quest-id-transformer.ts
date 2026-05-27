/**
 * PURPOSE: Walks a batch of chat entries and returns the latest QuestId referenced anywhere in their tool_use inputs, tool_result content, or user message content. Lets the WS broadcaster route monitor-session chat-output to subscribed clients even when the watcher emit carries no workItemId — ChaosWhisperer (running in the user's Claude Code session via /dumpster-create) has no work item, so the only way to associate its tool calls with a quest is to read the questId out of MCP tool inputs/outputs.
 *
 * USAGE:
 * const questId = chatEntriesExtractQuestIdTransformer({ entries });
 * // Returns: QuestId of the most recent entry that referenced one, or undefined if none.
 */

import { questIdContract, type ChatEntry, type QuestId } from '@dungeonmaster/shared/contracts';

const QUEST_ID_REGEX = /"questId"\s*:\s*"([^"]+)"/u;

export const chatEntriesExtractQuestIdTransformer = ({
  entries,
}: {
  entries: readonly ChatEntry[];
}): QuestId | undefined => {
  for (let i = entries.length - 1; i >= 0; i -= 1) {
    const entry = entries[i];
    if (entry === undefined) continue;

    const text =
      entry.role === 'assistant' && entry.type === 'tool_use'
        ? String(entry.toolInput)
        : entry.role === 'assistant' && entry.type === 'tool_result'
          ? String(entry.content)
          : entry.role === 'user'
            ? String(entry.content)
            : '';
    if (text.length === 0) continue;

    const match = QUEST_ID_REGEX.exec(text);
    if (match === null) continue;
    const [, candidate] = match;
    if (candidate === undefined) continue;

    const parsed = questIdContract.safeParse(candidate);
    if (parsed.success) return parsed.data;
  }
  return undefined;
};
