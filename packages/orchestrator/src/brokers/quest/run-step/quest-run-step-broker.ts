/**
 * PURPOSE: Runs ONE deterministic step for the dispatcher and writes what it did onto the work item
 * — `in_progress` before the handler, then terminal carrying the handler's classified word. Reach
 * for this over calling `stepHandlerRunBroker` directly: that broker CLASSIFIES and nothing more,
 * where this is the only thing that records the classification where the router will read it back.
 *
 * USAGE:
 * await questRunStepBroker({ step, onLine });
 * // `step` is the `run-step` NextStep the dispatch scan returned; resolves to its StepHandlerResult
 *
 * IT ROUTES NOTHING. The word lands on the work item as `declaredWord` and the scope's next move is
 * `questRouteScopeBroker`'s to decide on the following scan — the same shape a prompt step takes,
 * where `quest-work` writes the word and the router reads it. A handler that decided its own route
 * would be a second router, and the two would disagree the first time a graph changed.
 *
 * `wall` IS THE ONE WORD THAT MARKS THE ITEM `failed`, carrying the handler's detail as its
 * `errorMessage`, because the execution row is where a human reads why a quest halted. Every other
 * word is a step that ran and reported.
 *
 * `onLine` IS REQUIRED for the reason every command broker's is: a deterministic step's work item
 * carries no `sessionId`, so no JSONL watcher can ever tail it and this callback is the only route
 * its output has to a UI.
 */

import {
  contentTextContract,
  errorMessageContract,
  workItemContract,
} from '@dungeonmaster/shared/contracts';
import {
  isPendingWorkItemStatusGuard,
  isTerminalWorkItemStatusGuard,
} from '@dungeonmaster/shared/guards';

import type { RunStep } from '../../../contracts/run-step/run-step-contract';
import type { StepHandlerResult } from '../../../contracts/step-handler-result/step-handler-result-contract';
import { stepHandlerRunBroker } from '../../step-handler/run/step-handler-run-broker';
import { questOperationsUpdateBroker } from '../operations-update/quest-operations-update-broker';

export const questRunStepBroker = async ({
  step,
  onLine,
}: {
  step: RunStep;
  onLine: (line: string) => void;
}): Promise<StepHandlerResult> => {
  const { questId, workItemId } = step;

  await questOperationsUpdateBroker({
    questId,
    update: ({ quest }) => {
      const workItem = quest.workItems.find((item) => item.id === workItemId);

      if (workItem === undefined || !isPendingWorkItemStatusGuard({ status: workItem.status })) {
        return null;
      }

      return {
        workItems: quest.workItems.map((item) =>
          item.id === workItemId
            ? workItemContract.parse({
                ...item,
                status: 'in_progress',
                startedAt: new Date().toISOString(),
              })
            : item,
        ),
      };
    },
  });

  const result = await stepHandlerRunBroker({
    handler: step.handler,
    // The step's own `args`, verbatim: `agentFlowStatics` is where a ward step declares
    // `['--committed', '--uncommitted']` and the full gate declares `[]`.
    args: step.args.map(String),
    questId,
    workItemId,
    onLine,
  });

  await questOperationsUpdateBroker({
    questId,
    update: ({ quest }) => {
      const workItem = quest.workItems.find((item) => item.id === workItemId);

      if (workItem === undefined || isTerminalWorkItemStatusGuard({ status: workItem.status })) {
        return null;
      }

      const detail = String(result.detail);

      return {
        workItems: quest.workItems.map((item) =>
          item.id === workItemId
            ? workItemContract.parse({
                ...item,
                status: result.outcome === 'wall' ? 'failed' : 'complete',
                completedAt: new Date().toISOString(),
                declaredWord: result.outcome,
                ...(detail.length === 0
                  ? {}
                  : { declaredReason: contentTextContract.parse(detail) }),
                ...(result.outcome === 'wall' && detail.length > 0
                  ? { errorMessage: errorMessageContract.parse(detail) }
                  : {}),
                // The back-link the execution panel resolves a row's detail through —
                // `wardResults/<id>`, `riftcarverResults/<id>`.
                ...(result.resultRef === undefined
                  ? {}
                  : { relatedDataItems: [...item.relatedDataItems, result.resultRef] }),
              })
            : item,
        ),
      };
    },
  });

  return result;
};
