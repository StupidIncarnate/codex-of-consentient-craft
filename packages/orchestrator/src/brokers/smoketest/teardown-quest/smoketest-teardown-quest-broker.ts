/**
 * PURPOSE: Removes a smoketest quest folder from disk so the next case starts with a clean slate
 *
 * USAGE:
 * await smoketestTeardownQuestBroker({ questId });
 * // Deletes the quest folder recursively. Idempotent when the quest is already gone.
 *
 * WHEN-TO-USE: At the end of each orchestration smoketest case — before hydrating the next case — to guarantee
 * no stale workItems, status, or persisted overrides bleed across cases.
 *
 * NOTE: Scenario-state cleanup (`smoketestScenarioState.unregister(...)`) is the responsibility of the calling
 * responder/flow. Brokers/ may not import state/, so the scenario unregister is performed at the responder layer.
 */

import { filePathContract } from '@dungeonmaster/shared/contracts';
import type { FilePath, QuestId } from '@dungeonmaster/shared/contracts';

import { fsRmAdapter } from '../../../adapters/fs/rm/fs-rm-adapter';
import { questFindQuestPathBroker } from '../../quest/find-quest-path/quest-find-quest-path-broker';

export const smoketestTeardownQuestBroker = async ({
  questId,
}: {
  questId: QuestId;
}): Promise<{ success: true }> => {
  const resolvedQuestPath: FilePath | null = await questFindQuestPathBroker({ questId })
    .then((resolved) => filePathContract.parse(resolved.questPath))
    .catch(() => null);

  if (resolvedQuestPath === null) {
    // Quest not found — nothing to remove
    return { success: true as const };
  }

  try {
    await fsRmAdapter({
      filePath: resolvedQuestPath,
      recursive: true,
      force: true,
    });
  } catch {
    // Directory already removed or concurrent cleanup — idempotent no-op.
  }

  return { success: true as const };
};
