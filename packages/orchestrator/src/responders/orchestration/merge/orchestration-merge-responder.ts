/**
 * PURPOSE: Performs the server-side half of pressing "Teleport with Booty (Merge)" — the stop +
 * ledger-append + status-flip that has to land before the warpgate agent can be dispatched. Reach
 * for this rather than `OrchestrationStartResponder` when the quest is already finished: Start
 * builds a worktree and seeds a whole relay, whereas a merge appends a single operation to a
 * ledger that is already drained. The mergeable-status check is repeated here even though the HTTP
 * route ahead of it gates on the same flag, because this is the call that MUTATES the ledger and
 * the route is not its only possible caller.
 *
 * USAGE:
 * const result = await OrchestrationMergeResponder({ questId });
 * // Returns { merging: true } once the quest is at 'merging' with a pending warpgate operation
 * // (and its linked work item) on the ledger; throws when the quest is missing, not mergeable, or
 * // the status transition itself is rejected.
 */

import {
  getQuestInputContract,
  modifyQuestInputContract,
  operationItemContract,
  questWorkItemIdContract,
  workItemContract,
} from '@dungeonmaster/shared/contracts';
import type { QuestId } from '@dungeonmaster/shared/contracts';
import {
  isMergeableQuestStatusGuard,
  isPostQuestChatWorkItemRoleGuard,
} from '@dungeonmaster/shared/guards';

import { questGetBroker } from '../../../brokers/quest/get/quest-get-broker';
import { questModifyBroker } from '../../../brokers/quest/modify/quest-modify-broker';
import { questOperationsUpdateBroker } from '../../../brokers/quest/operations-update/quest-operations-update-broker';
import { orchestrationProcessesState } from '../../../state/orchestration-processes/orchestration-processes-state';
import { warpgateOperationStatics } from '../../../statics/warpgate-operation/warpgate-operation-statics';

export const OrchestrationMergeResponder = async ({
  questId,
}: {
  questId: QuestId;
}): Promise<{ merging: boolean }> => {
  const input = getQuestInputContract.parse({ questId });
  const getResult = await questGetBroker({ input });

  if (!getResult.success || !getResult.quest) {
    throw new Error(`Quest not found: ${questId}`);
  }

  const { quest } = getResult;

  // This responder MUTATES the ledger, so it re-checks the status against the quest it just read
  // from disk rather than trusting its caller — the HTTP route ahead of this gates on the same
  // flag, but a stale page or a forged request could still reach here with a quest that moved on.
  if (!isMergeableQuestStatusGuard({ status: quest.status })) {
    throw new Error(`Quest must be blocked or complete to merge. Current status: ${quest.status}`);
  }

  // Only one agent may ever hold the quest's worktree. The follow-up chat spawns outside the
  // operations ledger — it never changes quest status — so nothing else would stop it before
  // warpgate starts working the same worktree; stop it here, before anything is written.
  const followupItem = quest.workItems.find((workItem) =>
    isPostQuestChatWorkItemRoleGuard({ role: workItem.role }),
  );
  if (followupItem !== undefined) {
    const runningProcess = orchestrationProcessesState.findByQuestWorkItemId({
      questWorkItemId: followupItem.id,
    });
    if (runningProcess !== undefined) {
      orchestrationProcessesState.kill({ processId: runningProcess.processId });
    }
  }

  // Flip status BEFORE appending the operation. questOperationsUpdateBroker re-derives quest
  // status on every write from whatever status it reads off disk: from `complete` a pending
  // warpgate operation would derive `in_progress` (neither a legal transition out of `complete`
  // nor what a merge means), and from `blocked` the derivation preserves `blocked` outright.
  // Flipping first here means the ops-update broker's own read sees `merging` already landed, so
  // its derivation — which keys on the CURRENT status — returns `merging` instead.
  const modifyResult = await questModifyBroker({
    input: modifyQuestInputContract.parse({ questId, status: 'merging' }),
  });

  if (!modifyResult.success) {
    throw new Error(`Failed to start merge: ${modifyResult.error}`);
  }

  const operationItemId = crypto.randomUUID();
  const warpgateWorkItemId = questWorkItemIdContract.parse(crypto.randomUUID());
  const now = new Date().toISOString();

  await questOperationsUpdateBroker({
    questId,
    update: ({ quest: current }) => {
      // Double-submit guard. Two clicks on Teleport with Booty are two POSTs, and both read the
      // quest and clear the mergeable-status gate before either one writes — so neither the route
      // nor the check above can tell them apart. This callback is the only place that can: it runs
      // inside questOperationsUpdateBroker's per-quest lock, against a quest re-read inside that
      // lock, so the loser sees the winner's entry. Returning null skips the persist entirely.
      // Without it a double-click mints N warpgate operations and N work items, and the quest can
      // only reach `merged` after N separate merge agents have each run against the one worktree.
      if (current.operations.some((operation) => operation.role === 'warpgate')) {
        return null;
      }

      // Merging is the deliberate END of the quest. A `blocked` quest arrives here with operation
      // items still `pending`/`in_progress` — the block drained the WORK items to `skipped`, but
      // an operation item has no skipped state. Leaving them non-complete would keep the quest
      // deriving to `merging` forever instead of settling at `merged`, and would let the dispatch
      // scan's advance self-heal mint and dispatch an abandoned relay item into the worktree the
      // moment the merge finishes. On a `complete` quest the ledger is already drained, so this is
      // a no-op.
      const closedOut = current.operations.map((operation) =>
        operation.status === 'complete'
          ? operation
          : operationItemContract.parse({ ...operation, status: 'complete' }),
      );

      const warpgateOperation = operationItemContract.parse({
        id: operationItemId,
        role: 'warpgate',
        text: warpgateOperationStatics.text,
        status: 'pending',
        // locked enrolls warpgate in the pt-continuation budget (slotManagerStatics.warpgate.
        // maxAttempts) — the only bound on an agent that never converges on its own.
        locked: true,
        flowIds: [],
      });

      const warpgateWorkItem = workItemContract.parse({
        id: warpgateWorkItemId,
        role: 'warpgate',
        status: 'pending',
        spawnerType: 'agent',
        // The operation is appended pending, not in_progress — it is minted WITH its work item
        // right here, and questAdvanceBroker's strict-1:1 resume guard skips any pending
        // operation that already has a linked work item, so no second work item can ever be
        // created for it. The signal-back handler marks the operation complete when warpgate
        // finishes, whichever status it was sitting in.
        relatedDataItems: [`operations/${operationItemId}`],
        // Deliberately NOT chained after the quest's last work item the way questAdvanceBroker
        // chains a relay item — the merge is a fresh top-level dispatch on a finished quest, not
        // the next relay step. On a blocked quest the trailing work items are skipped, and
        // skipped does NOT satisfy dependsOn, so a chained merge item would never become ready.
        dependsOn: [],
        maxAttempts: 1,
        createdAt: now,
      });

      return {
        operations: [...closedOut, warpgateOperation],
        workItems: [...current.workItems, warpgateWorkItem],
      };
    },
  });

  return { merging: true };
};
