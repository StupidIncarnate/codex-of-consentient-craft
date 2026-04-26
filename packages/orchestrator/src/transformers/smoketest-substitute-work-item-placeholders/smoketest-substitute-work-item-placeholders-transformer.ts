/**
 * PURPOSE: Substitutes `{{questId}}`, `{{guildId}}`, and `{{processId}}` placeholders inside each work item's smoketestPromptOverride with the live ids of the smoketest run
 *
 * USAGE:
 * const updated = smoketestSubstituteWorkItemPlaceholdersTransformer({ workItems, questId, guildId, processId });
 * // Returns a new WorkItem[] where every override has its placeholders replaced. Work items without
 * // an override are returned unchanged. Work items whose override does not contain a placeholder are
 * // returned by reference identity.
 *
 * WHEN-TO-USE: `enqueue-bundled-suite-layer-responder` calls this AFTER `questHydrateBroker` returns
 * the live questId AND the responder pre-registers an orchestration processId, so the canned probe
 * prompts that reference `{{questId}}` / `{{guildId}}` / `{{processId}}` end up pointing at the
 * smoketest's own running quest/guild/process rather than placeholder values.
 */

import type { GuildId, ProcessId, QuestId, WorkItem } from '@dungeonmaster/shared/contracts';
import { workItemContract } from '@dungeonmaster/shared/contracts';

import { promptTextContract } from '../../contracts/prompt-text/prompt-text-contract';

const QUEST_ID_PLACEHOLDER = '{{questId}}';
const GUILD_ID_PLACEHOLDER = '{{guildId}}';
const PROCESS_ID_PLACEHOLDER = '{{processId}}';

export const smoketestSubstituteWorkItemPlaceholdersTransformer = ({
  workItems,
  questId,
  guildId,
  processId,
}: {
  workItems: readonly WorkItem[];
  questId: QuestId;
  guildId: GuildId;
  processId: ProcessId;
}): WorkItem[] =>
  workItems.map((wi) => {
    if (wi.smoketestPromptOverride === undefined) {
      return wi;
    }
    const original = String(wi.smoketestPromptOverride);
    const substituted = original
      .split(QUEST_ID_PLACEHOLDER)
      .join(String(questId))
      .split(GUILD_ID_PLACEHOLDER)
      .join(String(guildId))
      .split(PROCESS_ID_PLACEHOLDER)
      .join(String(processId));
    if (substituted === original) {
      return wi;
    }
    return workItemContract.parse({
      ...wi,
      smoketestPromptOverride: promptTextContract.parse(substituted),
    });
  });
