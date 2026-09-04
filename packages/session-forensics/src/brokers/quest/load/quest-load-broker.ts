/**
 * PURPOSE: Every coverage measurement starts from a quest id and needs that quest's flows. A flow
 * is one graph of work inside a quest: nodes, edges, and the sign-offs recorded on them. A
 * quest.json file is routinely over half a megabyte, so loading only the flows is far cheaper than
 * loading the whole document. Reach for this broker instead of reading the file yourself.
 *
 * USAGE:
 * questLoadBroker({ questId: QuestIdStub() });
 * // Returns that quest's flows, in file order. Returns [] when the quest cannot be found, its file
 * // cannot be parsed as JSON, or its flows fail validation.
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
