/**
 * PURPOSE: Extracts {questId, workItemId} from a sub-agent's first user-text line, whose
 * content is Claude CLI's verbatim copy of the `Task.input.prompt` the orchestrator
 * dispatched. The taskPrompt is built by `build-task-prompt-layer-broker.ts` and always
 * embeds `workItemId: "<uuid>"` and `questId: "<uuid>"` as plain text — the watcher can
 * recover both ids by regex once that line lands in the sub-agent JSONL.
 *
 * USAGE:
 * taskPromptIdsExtractorTransformer({ parsed: normalizedLine });
 * // Returns { questId, workItemId } when both ids are found, null otherwise
 */
import { questIdContract, questWorkItemIdContract } from '@dungeonmaster/shared/contracts';
import type { QuestId, QuestWorkItemId } from '@dungeonmaster/shared/contracts';

import { normalizedStreamLineContentItemContract } from '../../contracts/normalized-stream-line-content-item/normalized-stream-line-content-item-contract';
import { normalizedStreamLineContract } from '../../contracts/normalized-stream-line/normalized-stream-line-contract';

const WORK_ITEM_ID_PATTERN = /workItemId:\s*"([^"]+)"/u;
const QUEST_ID_PATTERN = /questId:\s*"([^"]+)"/u;

export const taskPromptIdsExtractorTransformer = ({
  parsed,
}: {
  parsed: unknown;
}): { questId: QuestId; workItemId: QuestWorkItemId } | null => {
  const lineParse = normalizedStreamLineContract.safeParse(parsed);
  if (!lineParse.success) {
    return null;
  }
  const line = lineParse.data;
  if (line.type === undefined || String(line.type) !== 'user') {
    return null;
  }

  const raw: unknown = line.message?.content;
  const texts =
    typeof raw === 'string'
      ? [raw]
      : Array.isArray(raw)
        ? raw.flatMap((item: unknown) => {
            const itemParse = normalizedStreamLineContentItemContract.safeParse(item);
            if (!itemParse.success) {
              return [];
            }
            const itemData = itemParse.data;
            if (itemData.type === undefined || String(itemData.type) !== 'text') {
              return [];
            }
            if (itemData.text === undefined) {
              return [];
            }
            return [String(itemData.text)];
          })
        : [];

  for (const text of texts) {
    const workMatch = WORK_ITEM_ID_PATTERN.exec(text);
    const questMatch = QUEST_ID_PATTERN.exec(text);
    if (workMatch === null || questMatch === null) {
      continue;
    }
    const workParse = questWorkItemIdContract.safeParse(workMatch[1]);
    const questParse = questIdContract.safeParse(questMatch[1]);
    if (workParse.success && questParse.success) {
      return { questId: questParse.data, workItemId: workParse.data };
    }
  }
  return null;
};
