/**
 * PURPOSE: The operation item a work item's `operations/<id>` ref points at, or `undefined` when
 * the work item carries no such ref (a chat role, or a work item minted before this invariant). The
 * SAME lookup `questResetFlowSignoffsBroker` and `questHandleSignalBackResponder` each repeat inline
 * — pulled out here so `quest-work`'s `invalidation` and `request` payloads share it.
 *
 * USAGE:
 * workItemLinkedOperationResolveTransformer({ quest: QuestStub(), workItem: WorkItemStub() });
 * // Returns the OperationItem this work item is linked to, or undefined
 */

import type { OperationItem, Quest, WorkItem } from '@dungeonmaster/shared/contracts';

const OPERATIONS_REF_PREFIX = 'operations/';

export const workItemLinkedOperationResolveTransformer = ({
  quest,
  workItem,
}: {
  quest: Quest;
  workItem: WorkItem;
}): OperationItem | undefined => {
  const linkedRef = workItem.relatedDataItems
    .map((ref) => String(ref))
    .find((ref) => ref.startsWith(OPERATIONS_REF_PREFIX));
  const linkedId = linkedRef?.slice(OPERATIONS_REF_PREFIX.length);

  return quest.operations.find((item) => String(item.id) === linkedId);
};
