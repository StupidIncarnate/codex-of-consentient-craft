/**
 * PURPOSE: Substitutes `{{questId}}` and `{{guildId}}` placeholders inside each work item's smoketestPromptOverride with the live questId/guildId of the smoketest run
 *
 * USAGE:
 * const updated = smoketestSubstituteWorkItemPlaceholdersTransformer({ workItems, questId, guildId });
 * // Returns a new WorkItem[] where every override has its placeholders replaced. Work items without
 * // an override are returned unchanged. Work items whose override does not contain a placeholder are
 * // returned by reference identity.
 *
 * WHEN-TO-USE: `enqueue-bundled-suite-layer-responder` calls this AFTER `questHydrateBroker` returns
 * the live questId, so the canned probe prompts that reference `{{questId}}` / `{{guildId}}` end up
 * pointing at the smoketest's own running quest/guild rather than the placeholder zero-UUID.
 */

import type { GuildId, QuestId, WorkItem } from '@dungeonmaster/shared/contracts';
import { workItemContract } from '@dungeonmaster/shared/contracts';

import { promptTextContract } from '../../contracts/prompt-text/prompt-text-contract';

const QUEST_ID_PLACEHOLDER = '{{questId}}';
const GUILD_ID_PLACEHOLDER = '{{guildId}}';

export const smoketestSubstituteWorkItemPlaceholdersTransformer = ({
  workItems,
  questId,
  guildId,
}: {
  workItems: readonly WorkItem[];
  questId: QuestId;
  guildId: GuildId;
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
      .join(String(guildId));
    if (substituted === original) {
      return wi;
    }
    return workItemContract.parse({
      ...wi,
      smoketestPromptOverride: promptTextContract.parse(substituted),
    });
  });
