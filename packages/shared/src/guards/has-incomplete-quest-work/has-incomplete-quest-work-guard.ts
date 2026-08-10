/**
 * PURPOSE: True when a quest still has something for a dispatcher to pick up — a non-terminal work
 * item, or an operation item the ledger has not drained yet.
 *
 * USAGE:
 * hasIncompleteQuestWorkGuard({ workItems: quest.workItems, operations: quest.operations });
 * // Returns true while a work item is dispatchable OR advance can still mint one from the ledger
 *
 * WHEN-TO-USE: Before doing something whose only purpose is to make a quest progress — starting
 *   the Node dispatcher on resume, for one. A quest with a drained ledger has nothing to progress,
 *   and starting a GLOBAL dispatcher for it would reach across every other quest for no reason.
 * WHEN-NOT-TO-USE: To decide a quest's status. That is
 *   `workItemsToQuestStatusTransformer`, which also weighs failure and pause/abandon ownership.
 *
 * Both halves matter: the ledger check covers the window where the last session finished and
 * advance has not created the next work item yet, so "every work item is terminal" alone would
 * read as "nothing left to do" mid-relay.
 *
 * Chat-role work items (chaoswhisperer / glyphsmith / bughunt / tavernkeeper) never count as
 * dispatchable — `computeReadyWorkItemsLayerBroker` excludes them outright, and the orchestration
 * loop only ever runs one from a real user message, never from a resume. A lingering non-terminal
 * chat item (a tavernkeeper follow-up thread nobody drove to completion, for instance) would
 * otherwise read as "incomplete work" and start the Node dispatcher globally for a quest the
 * dispatcher will never actually act on.
 */

import type { OperationItem } from '../../contracts/operation-item/operation-item-contract';
import type { WorkItem } from '../../contracts/work-item/work-item-contract';
import { isChatWorkItemRoleGuard } from '../is-chat-work-item-role/is-chat-work-item-role-guard';
import { isTerminalWorkItemStatusGuard } from '../is-terminal-work-item-status/is-terminal-work-item-status-guard';

export const hasIncompleteQuestWorkGuard = ({
  workItems,
  operations,
}: {
  workItems?: readonly WorkItem[];
  operations?: readonly OperationItem[];
}): boolean =>
  (workItems ?? []).some(
    (workItem) =>
      !isChatWorkItemRoleGuard({ role: workItem.role }) &&
      !isTerminalWorkItemStatusGuard({ status: workItem.status }),
  ) || (operations ?? []).some((operation) => operation.status !== 'complete');
