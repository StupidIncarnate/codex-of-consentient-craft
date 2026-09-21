/**
 * PURPOSE: THE ENTRY POINT for every deterministic step. Dispatches through a TABLE, not a switch
 * — the table carries `satisfies Record<StepHandlerName, StepHandler>`, the same mechanism
 * `agentNameToPromptTransformer` uses for prompts, so a handler named in `agentFlowStatics` with no
 * implementation behind it fails the BUILD rather than throwing on the one quest that reaches that
 * step (delete an entry below and the file stops typechecking — that IS the test).
 *
 * This is also THE HANDLER BOUNDARY a thrown error becomes `wall` at: a handler that hits an
 * exceptional condition it does not itself classify (a missing worktree, malformed CLI output)
 * throws, and this broker is what turns that throw into a `StepHandlerResult` instead of letting it
 * propagate as an unhandled rejection with nothing to route it. A handler's own DIRECT classified
 * `wall` (a ward crash, a riftcarver git-state red) never reaches this catch — those are returned
 * values, not throws.
 *
 * USAGE:
 * const result = await stepHandlerRunBroker({
 *   handler: 'ward',
 *   args: ['--committed', '--uncommitted'],
 *   questId,
 *   workItemId,
 *   onLine: (line) => emit(line),
 * });
 * // { outcome: 'done' | 'empty' | 'unmet' | 'wall', detail, resultRef? }
 */

import {
  contentTextContract,
  type QuestId,
  type QuestWorkItemId,
} from '@dungeonmaster/shared/contracts';

import { stepHandlerResultContract } from '../../../contracts/step-handler-result/step-handler-result-contract';
import type { StepHandlerResult } from '../../../contracts/step-handler-result/step-handler-result-contract';
import type { StepHandlerName } from '../../../contracts/step-handler-name/step-handler-name-contract';
import { stepHandlerCleanupBroker } from '../cleanup/step-handler-cleanup-broker';
import { stepHandlerCommitBroker } from '../commit/step-handler-commit-broker';
import { stepHandlerRiftcarverBroker } from '../riftcarver/step-handler-riftcarver-broker';
import { stepHandlerWardBroker } from '../ward/step-handler-ward-broker';

type StepHandler = (params: {
  args: string[];
  questId: QuestId;
  workItemId: QuestWorkItemId;
  onLine: (line: string) => void;
}) => Promise<StepHandlerResult>;

const HANDLERS = {
  ward: stepHandlerWardBroker,
  riftcarver: stepHandlerRiftcarverBroker,
  commit: stepHandlerCommitBroker,
  cleanup: stepHandlerCleanupBroker,
} satisfies Record<StepHandlerName, StepHandler>;

export const stepHandlerRunBroker = async ({
  handler,
  args,
  questId,
  workItemId,
  onLine,
}: {
  handler: StepHandlerName;
  args: string[];
  questId: QuestId;
  workItemId: QuestWorkItemId;
  onLine: (line: string) => void;
}): Promise<StepHandlerResult> => {
  try {
    return await HANDLERS[handler]({ args, questId, workItemId, onLine });
  } catch (error: unknown) {
    return stepHandlerResultContract.parse({
      outcome: 'wall',
      detail: contentTextContract.parse(error instanceof Error ? error.message : String(error)),
    });
  }
};
