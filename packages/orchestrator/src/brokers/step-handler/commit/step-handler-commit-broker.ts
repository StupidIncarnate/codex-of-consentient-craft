/**
 * PURPOSE: Commits and pushes a deterministic `commit` step — `git add -A`, `git commit
 * --allow-empty` with a message DERIVED from the work items the commit covers (never prose), then
 * a bare `git push`. Classifies `empty` when the working tree was already clean BEFORE staging
 * (`gitWorkingTreeFilesBroker`, measured first — a bare `git diff HEAD` would call a tree carrying
 * only untracked files clean, which is exactly the miss this measurement exists to avoid), `done`
 * otherwise. The push is bare, no `setUpstream` — riftcarver's carve-time push already established
 * the upstream, so no session downstream of it ever has to decide whether `-u` is needed.
 *
 * `args` rides the signature for symmetry with the other three handlers; a commit step declares
 * none and this handler never reads it.
 *
 * The scope and the covered work items are read off the quest: this handler's OWN work item names
 * its linked operation item (`relatedDataItems: ['operations/<id>']`), and that operation item's
 * `text` is the message's scope line.
 *
 * WHICH work items the message covers is THIS PASS's, not the scope's whole history. One operation
 * item carries many work items — a scope cycles `work ⇄ review` and commits once per pass — so the
 * covered set is every work item on this scope between the PREVIOUS commit at this step and this
 * one, which is exactly the `plan`/`work`/`review` run whose marks this commit is landing. Taking
 * every work item sharing the link instead re-lists every earlier pass's marks under every later
 * commit, and the second commit on a scope would claim work the first already recorded. The cut
 * uses ARRAY order rather than `createdAt`, for the reason `next-action-transformer.ts` gives at
 * its own header: a parallel batch is minted inside one persist and shares a timestamp.
 *
 * Where no linked operation is found (a `repair`'s own commit, minted with nothing to link), the
 * scope falls back to this work item's own id and the message carries no marks — see
 * `commitMessageBuildTransformer`'s own header for that shape.
 *
 * `git add`, `git commit` and `git push` run inside `questWithModifyLockBroker` — the same
 * per-quest lock `questModifyBroker` and `questOperationsUpdateBroker` take — so two commit
 * handlers landing on the same worktree at once serialize instead of colliding on git's own
 * `index.lock`.
 *
 * USAGE:
 * const result = await stepHandlerCommitBroker({ args: [], questId, workItemId, onLine });
 * // { outcome: 'done' | 'empty', detail }
 */

import {
  absoluteFilePathContract,
  contentTextContract,
  getQuestInputContract,
  stepNameContract,
  type ErrorMessage,
  type QuestId,
  type QuestWorkItemId,
} from '@dungeonmaster/shared/contracts';

import { gitAddAllAdapter } from '../../../adapters/git/add-all/git-add-all-adapter';
import { gitCommitAdapter } from '../../../adapters/git/commit/git-commit-adapter';
import { gitPushAdapter } from '../../../adapters/git/push/git-push-adapter';
import { stepHandlerResultContract } from '../../../contracts/step-handler-result/step-handler-result-contract';
import type { StepHandlerResult } from '../../../contracts/step-handler-result/step-handler-result-contract';
import { commitMessageBuildTransformer } from '../../../transformers/commit-message-build/commit-message-build-transformer';
import { gitWorkingTreeFilesBroker } from '../../git/working-tree-files/git-working-tree-files-broker';
import { questCwdResolveBroker } from '../../quest/cwd-resolve/quest-cwd-resolve-broker';
import { questGetBroker } from '../../quest/get/quest-get-broker';
import { questWithModifyLockBroker } from '../../quest/with-modify-lock/quest-with-modify-lock-broker';

const DEFAULT_STEP_NAME = stepNameContract.parse('commit');
const OPERATIONS_REF_PREFIX = 'operations/';

export const stepHandlerCommitBroker = async ({
  args: _args,
  questId,
  workItemId,
  onLine,
}: {
  args: string[];
  questId: QuestId;
  workItemId: QuestWorkItemId;
  onLine: (line: string) => void;
}): Promise<StepHandlerResult> => {
  const resolution = await questCwdResolveBroker({ questId });
  if (resolution.kind === 'missing-worktree') {
    throw new Error(
      `Cannot commit for quest ${questId}: worktree not found: ${resolution.worktreePath}`,
    );
  }
  const cwd = absoluteFilePathContract.parse(resolution.cwd);

  // Measured BEFORE staging: after `git add -A` the tree always reads clean, so "was this a
  // review-only pass" can only be answered by looking first.
  const changedFiles = await gitWorkingTreeFilesBroker({ cwd });
  const isEmpty = changedFiles.length === 0;

  const getResult = await questGetBroker({ input: getQuestInputContract.parse({ questId }) });
  if (!getResult.success || getResult.quest === undefined) {
    throw new Error(`Cannot commit for quest ${questId}: quest not found`);
  }
  const { quest } = getResult;

  const ownWorkItem = quest.workItems.find((item) => item.id === workItemId);
  if (ownWorkItem === undefined) {
    throw new Error(`Cannot commit for quest ${questId}: work item ${workItemId} not found`);
  }

  const linkedRef = ownWorkItem.relatedDataItems
    .map((ref) => String(ref))
    .find((ref) => ref.startsWith(OPERATIONS_REF_PREFIX));
  const linkedOperation = quest.operations.find(
    (operation) => `${OPERATIONS_REF_PREFIX}${operation.id}` === linkedRef,
  );

  const ownStep = ownWorkItem.step ?? DEFAULT_STEP_NAME;

  const scopeWorkItems =
    linkedOperation === undefined
      ? [ownWorkItem]
      : quest.workItems.filter((item) =>
          item.relatedDataItems
            .map((ref) => String(ref))
            .includes(`${OPERATIONS_REF_PREFIX}${linkedOperation.id}`),
        );

  const ownIndex = scopeWorkItems.findIndex((item) => item.id === workItemId);
  // The LAST earlier work item on this scope that ran this same commit step. Everything after it
  // is this pass; `undefined` means this is the scope's first commit, so the pass starts at the
  // scope's first work item.
  const previousCommit = [...scopeWorkItems.slice(0, ownIndex)]
    .reverse()
    .find((item) => item.step !== undefined && String(item.step) === String(ownStep));

  const coveredWorkItems = scopeWorkItems.slice(
    previousCommit === undefined ? 0 : scopeWorkItems.indexOf(previousCommit) + 1,
    ownIndex + 1,
  );

  const message = commitMessageBuildTransformer({
    family: ownWorkItem.role,
    step: ownStep,
    scope: contentTextContract.parse(String(linkedOperation?.text ?? ownWorkItem.id)),
    workItems: coveredWorkItems.map((item) => ({ id: item.id, observations: item.observations })),
  });

  const result = await questWithModifyLockBroker({
    questId,
    run: async (): Promise<{ pushFailed: boolean; pushOutput: ErrorMessage }> => {
      await gitAddAllAdapter({ cwd });
      onLine('git add -A');

      await gitCommitAdapter({ cwd, message, allowEmpty: true });
      onLine(`git commit -m "${message.split('\n')[0]}" --allow-empty`);

      const pushResult = await gitPushAdapter({ cwd });
      onLine(pushResult.exitCode === 0 ? 'git push' : `git push failed: ${pushResult.output}`);

      return { pushFailed: pushResult.exitCode !== 0, pushOutput: pushResult.output };
    },
  });

  // A failed push leaves every commit in the worktree — it is `done` with the failure named in
  // `detail`, never a `wall` that halts a quest over a network blip. Same judgement riftcarver
  // already makes, where a failed push classifies `repairable` rather than `git-state`.
  const detail = result.pushFailed
    ? `${message}\n\n— push failed: ${result.pushOutput} —`
    : message;

  return stepHandlerResultContract.parse({
    outcome: isEmpty ? 'empty' : 'done',
    detail: contentTextContract.parse(detail),
  });
};
