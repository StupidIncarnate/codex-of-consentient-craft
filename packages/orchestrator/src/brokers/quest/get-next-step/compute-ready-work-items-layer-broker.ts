/**
 * PURPOSE: Layer helper for questGetNextStepBroker — given the quest's workItems[], returns the subset that is `pending` and whose `dependsOn` ids are all in a status that satisfies dependencies (complete/failed). These are the items the orchestrator may dispatch right now, returned in the SAME floor order the web execution view renders (`workItemsInDispatchOrderTransformer`): topological depth, then role/floor position, then createdAt. Because the ready set is depth-ordered, `selectBatchLayerBroker` grabbing the first item always dispatches the shallowest-floor ready item — a deeper-floor item never runs while a shallower-floor item is still pending. A pending chat-role item (`isChatWorkItemRoleGuard`) is excluded outright: a chat role is spawned only by the route that owns it (the chat loop, or its originating flow), so the dispatcher must never treat it as a candidate — otherwise a headless dispatch session would hit the throw `get-agent-prompt` raises for chat roles.
 *
 * USAGE:
 * const ready = computeReadyWorkItemsLayerBroker({ workItems });
 * // Returns: WorkItem[] — items eligible for dispatch on this scan, in floor order
 */

import type { WorkItem } from '@dungeonmaster/shared/contracts';
import {
  isChatWorkItemRoleGuard,
  isPendingWorkItemStatusGuard,
  satisfiesDependencyWorkItemStatusGuard,
} from '@dungeonmaster/shared/guards';
import { workItemsInDispatchOrderTransformer } from '@dungeonmaster/shared/transformers';

export const computeReadyWorkItemsLayerBroker = ({
  workItems,
}: {
  workItems: WorkItem[];
}): WorkItem[] => {
  const completedIds = new Set(
    workItems
      .filter((item) => satisfiesDependencyWorkItemStatusGuard({ status: item.status }))
      .map((item) => item.id),
  );
  return workItemsInDispatchOrderTransformer({ workItems }).filter(
    (item) =>
      isPendingWorkItemStatusGuard({ status: item.status }) &&
      item.dependsOn.every((depId) => completedIds.has(depId)) &&
      !isChatWorkItemRoleGuard({ role: item.role }),
  );
};
