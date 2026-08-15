/**
 * PURPOSE: Resolves the placeholder tokens a canned smoketest prompt was authored with against the
 * live ids of one run — the whole-array pass the BUNDLED suites make at enqueue time. Reach for the
 * scenario driver's stamp-time substitution instead when the work item is minted mid-relay and its
 * id is not known until then.
 *
 * USAGE:
 * const updated = smoketestSubstituteWorkItemPlaceholdersTransformer({ workItems, questId, guildId, processId });
 * // Returns a new WorkItem[] where every override has its placeholders replaced. Work items without
 * // an override are returned unchanged. Work items whose override does not contain a placeholder are
 * // returned by reference identity.
 *
 * `workItemId` resolves per ITEM, off the item's own id, while the other three are run-wide. It is
 * the token nothing else could supply: `signal-back` requires it, and a scripted agent's one-line
 * prompt is its entire context.
 *
 * WHEN-TO-USE: `enqueue-bundled-suite-layer-responder` calls this AFTER `questHydrateBroker` returns
 * the live questId AND the responder pre-registers an orchestration processId, so the canned probe
 * prompts end up pointing at the smoketest's own running quest/guild/process rather than
 * placeholder values.
 */

import type { GuildId, ProcessId, QuestId, WorkItem } from '@dungeonmaster/shared/contracts';
import { workItemContract } from '@dungeonmaster/shared/contracts';

import { promptTextContract } from '../../contracts/prompt-text/prompt-text-contract';
import { smoketestPlaceholdersStatics } from '../../statics/smoketest-placeholders/smoketest-placeholders-statics';

const QUEST_ID_PLACEHOLDER = smoketestPlaceholdersStatics.questId;
const GUILD_ID_PLACEHOLDER = smoketestPlaceholdersStatics.guildId;
const PROCESS_ID_PLACEHOLDER = smoketestPlaceholdersStatics.processId;
const WORK_ITEM_ID_PLACEHOLDER = smoketestPlaceholdersStatics.workItemId;

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
      .join(String(processId))
      .split(WORK_ITEM_ID_PLACEHOLDER)
      .join(String(wi.id));
    if (substituted === original) {
      return wi;
    }
    return workItemContract.parse({
      ...wi,
      smoketestPromptOverride: promptTextContract.parse(substituted),
    });
  });
