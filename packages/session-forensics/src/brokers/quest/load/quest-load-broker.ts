/**
 * PURPOSE: Every coverage measurement starts from a quest id and needs that quest's flows AND its
 * work items. A flow is one graph of work inside a quest: nodes, edges, and the sign-offs recorded
 * on them. Work items carry `observations[]` — the sign-off record decision 1 moved onto them — and
 * real per-track marks cannot be computed without reading it alongside the flows. A quest.json file
 * is routinely over half a megabyte, so loading only these two arrays is far cheaper than loading
 * the whole document. Reach for this broker instead of reading the file yourself.
 *
 * USAGE:
 * questLoadBroker({ questId: QuestIdStub() });
 * // Returns { flows, workItems } for that quest, each in file order. The two arrays fail
 * // INDEPENDENTLY: a quest with valid flows but no workItems key still returns those flows, and
 * // vice versa. Both come back [] when the quest cannot be found or its file cannot be parsed as
 * // JSON at all.
 */

import { fsReadFileSyncAdapter } from '@dungeonmaster/shared/adapters';
import { safeJsonParseTransformer } from '@dungeonmaster/shared/transformers';
import { flowContract, workItemContract } from '@dungeonmaster/shared/contracts';
import type { QuestId, Flow, WorkItem } from '@dungeonmaster/shared/contracts';
import { questFindBroker } from '../find/quest-find-broker';

export const questLoadBroker = ({
  questId,
}: {
  questId: QuestId;
}): { flows: readonly Flow[]; workItems: readonly WorkItem[] } => {
  const empty = { flows: [], workItems: [] };
  const questPath = questFindBroker({ questId });

  if (questPath === undefined) {
    return empty;
  }

  const contents = fsReadFileSyncAdapter({ filePath: questPath });
  const parsed = safeJsonParseTransformer({ value: contents });

  if (!parsed.ok) {
    return empty;
  }

  const questJson = parsed.value;

  if (typeof questJson !== 'object' || questJson === null) {
    return empty;
  }

  const flowsResult =
    'flows' in questJson ? flowContract.array().safeParse(questJson.flows) : undefined;
  const workItemsResult =
    'workItems' in questJson ? workItemContract.array().safeParse(questJson.workItems) : undefined;

  return {
    flows: flowsResult?.success === true ? flowsResult.data : [],
    workItems: workItemsResult?.success === true ? workItemsResult.data : [],
  };
};
