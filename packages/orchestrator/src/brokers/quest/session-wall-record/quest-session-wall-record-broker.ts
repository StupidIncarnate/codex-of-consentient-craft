/**
 * PURPOSE: Records `wall` on a dispatched session's work item ON THE SESSION'S BEHALF — status
 * `failed`, `declaredWord: 'wall'`, the reason as both `declaredReason` and `errorMessage` — so the
 * router halts the quest on its next scan. Reach for this over `quest-work`'s `outcome` payload only
 * when the session itself cannot reach `quest-work`: the dungeonmaster MCP server never connected, or
 * the session ended its turns without signalling. questRunStepBroker writes the same record for a
 * deterministic handler's wall.
 *
 * USAGE:
 * await questSessionWallRecordBroker({ questId, workItemId, reason: 'the dungeonmaster MCP server …' });
 * // Returns { quest } once the item reads failed/wall on disk; null when it was already terminal
 */

import { workItemContract } from '@dungeonmaster/shared/contracts';
import type { Quest, WorkItem } from '@dungeonmaster/shared/contracts';
import { isTerminalWorkItemStatusGuard } from '@dungeonmaster/shared/guards';

import { questOperationsUpdateBroker } from '../operations-update/quest-operations-update-broker';

export const questSessionWallRecordBroker = async ({
  questId,
  workItemId,
  reason,
}: {
  questId: Quest['id'];
  workItemId: WorkItem['id'];
  reason: string;
}): Promise<{ quest: Quest } | null> => {
  const declaredReason = workItemContract.shape.declaredReason.unwrap().parse(reason);
  const errorMessage = workItemContract.shape.errorMessage.unwrap().parse(reason);

  return questOperationsUpdateBroker({
    questId,
    update: ({ quest }) => {
      const workItem = quest.workItems.find((item) => item.id === workItemId);

      // A session that signalled after all owns its own record; nothing here overwrites it.
      if (workItem === undefined || isTerminalWorkItemStatusGuard({ status: workItem.status })) {
        return null;
      }

      return {
        workItems: quest.workItems.map((item) =>
          item.id === workItemId
            ? workItemContract.parse({
                ...item,
                status: 'failed',
                completedAt: new Date().toISOString(),
                declaredWord: 'wall',
                declaredReason,
                errorMessage,
              })
            : item,
        ),
      };
    },
  });
};
