/**
 * PURPOSE: Every coverage measurement starts from a quest id and needs that quest's flow graph, and
 * a quest.json is routinely over half a megabyte — so `flows` is the one thing worth loading, not the
 * whole document. Reach for this over reading the file yourself.
 *
 * USAGE:
 * questLoadBroker({ questId: QuestIdStub() });
 * // Returns that quest's flows in file order, or [] when the quest cannot be found, its file cannot
 * // be parsed as JSON, or its flows fail validation
 */

import { fsReadFileSyncAdapter } from '@dungeonmaster/shared/adapters';
import { safeJsonParseTransformer } from '@dungeonmaster/shared/transformers';
import { flowContract } from '@dungeonmaster/shared/contracts';
import type { QuestId, Flow } from '@dungeonmaster/shared/contracts';
import { questFindBroker } from '../find/quest-find-broker';

export const questLoadBroker = ({ questId }: { questId: QuestId }): readonly Flow[] => {
  const questPath = questFindBroker({ questId });

  if (questPath === undefined) {
    return [];
  }

  const contents = fsReadFileSyncAdapter({ filePath: questPath });
  const parsed = safeJsonParseTransformer({ value: contents });

  if (!parsed.ok) {
    return [];
  }

  const questJson = parsed.value;

  if (typeof questJson !== 'object' || questJson === null || !('flows' in questJson)) {
    return [];
  }

  const result = flowContract.array().safeParse(questJson.flows);

  if (!result.success) {
    return [];
  }

  return result.data;
};
