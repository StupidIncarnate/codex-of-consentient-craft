/**
 * PURPOSE: Every coverage measurement starts from a quest id and needs that quest's flows AND its
 * work items. A flow is one graph of work inside a quest: nodes, edges, and the sign-offs recorded
 * on them. Work items carry `observations[]` — the sign-off record decision 1 moved onto them — and
 * real per-track marks cannot be computed without reading it alongside the flows. A quest.json file
 * is routinely over half a megabyte, so loading only these two arrays is far cheaper than loading
 * the whole document. Reach for this broker instead of reading the file yourself.
 *
 * USAGE:
 * await questLoadBroker({ questId: QuestIdStub() });
 * // Returns { flows, workItems } for that quest, each in file order. Both come back [] when the
 * // quest cannot be found or its file cannot be parsed as JSON at all. Flow parse failures throw
 * // naming the rejected field so corruption is surfaced loudly rather than swallowed.
 */

import { questLoadResultContract } from '../../../contracts/quest-load-result/quest-load-result-contract';
import type { QuestLoadResult } from '../../../contracts/quest-load-result/quest-load-result-contract';
import { readFileSync } from '#gateway/node/fs';
import { safeJsonParseTransformer } from '@dungeonmaster/shared/transformers';
import { flowContract, workItemContract } from '@dungeonmaster/shared/contracts';
import type { Quest } from '@dungeonmaster/shared/contracts';
import { questFindBroker } from '../find/quest-find-broker';

export const questLoadBroker = async ({
  questId,
}: {
  questId: Quest['id'];
}): Promise<QuestLoadResult> => {
  const empty = { flows: [], workItems: [] };
  const questPath = await questFindBroker({ questId });

  if (questPath === undefined) {
    return questLoadResultContract.parse(empty);
  }

  const contents = readFileSync(questPath);
  const parsed = safeJsonParseTransformer({ value: contents });

  if (!parsed.ok) {
    return questLoadResultContract.parse(empty);
  }

  const questJson = parsed.value;

  if (typeof questJson !== 'object' || questJson === null) {
    return questLoadResultContract.parse(empty);
  }

  const flowsResult =
    'flows' in questJson ? flowContract.array().safeParse(questJson.flows) : undefined;
  const workItemsResult =
    'workItems' in questJson ? workItemContract.array().safeParse(questJson.workItems) : undefined;

  if (flowsResult !== undefined && !flowsResult.success) {
    const reason = flowsResult.error.issues
      .map((issue) => `${issue.path.join('.') || '(root)'}: ${issue.message}`)
      .join('; ');
    throw new Error(`Failed to parse flows for quest ${questId}: ${reason}`, {
      cause: flowsResult.error,
    });
  }

  return questLoadResultContract.parse({
    flows: flowsResult?.success === true ? flowsResult.data : [],
    workItems: workItemsResult?.success === true ? workItemsResult.data : [],
  });
};
