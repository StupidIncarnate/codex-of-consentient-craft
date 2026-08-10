/**
 * PURPOSE: Handles quest resume requests by validating params, delegating to the orchestrator
 * adapter, and starting the Node dispatcher so the resumed quest actually moves.
 *
 * USAGE:
 * const result = await QuestResumeResponder({ params: { questId: 'abc' } });
 * // Returns { status: 200, data: { resumed: true, restoredStatus: 'in_progress', dispatch: { started: true } } }
 * //   or { status: 400/500, data: { error } }
 *
 * RESUME STARTS THE QUEUE. Resuming only flips quest status; the Node dispatcher is a SEPARATE
 * switch that normalizes to `paused` on every server boot. Leaving them independent means a
 * resumed quest sits at `in_progress` with a ready work item and nothing to pick it up — the user
 * pressed the button that says "resume" and watched nothing happen. So resume plays dispatch too.
 *
 * ONLY when THIS quest has work the dispatcher would actually pick up — the restored status is one
 * it scans (`isAnyAgentRunningQuestStatusGuard`, the dispatcher's own filter) AND the quest still has a non-terminal work item
 * or an undrained ledger. The dispatcher is global, so starting it for a quest it will skip anyway
 * (one resumed to `approved`, or one whose ledger is already drained) does nothing for that quest
 * while reaching across every other one. `dispatch.started: false` with a `no dispatchable work`
 * reason is the honest answer there.
 *
 * The exclusivity gate still owns the rest of the decision: a live `/dumpster-launch` loop (fresh
 * MCP heartbeat, or an in-flight Task agent) keeps its claim and dispatch stays paused — correct,
 * because that loop is already driving the queue. Either way the outcome rides back on the
 * response as `dispatch.started` (+ `dispatch.reason` when refused) rather than failing silently.
 * A play failure never fails the resume — the quest IS resumed at that point.
 */

import {
  hasIncompleteQuestWorkGuard,
  isAnyAgentRunningQuestStatusGuard,
  isQuestResumableQuestStatusGuard,
} from '@dungeonmaster/shared/guards';
import { orchestratorGetQuestAdapter } from '../../../adapters/orchestrator/get-quest/orchestrator-get-quest-adapter';
import { orchestratorPlayDispatchAdapter } from '../../../adapters/orchestrator/play-dispatch/orchestrator-play-dispatch-adapter';
import { orchestratorResumeQuestAdapter } from '../../../adapters/orchestrator/resume-quest/orchestrator-resume-quest-adapter';
import { questIdParamsContract } from '../../../contracts/quest-id-params/quest-id-params-contract';
import { responderResultContract } from '../../../contracts/responder-result/responder-result-contract';
import type { ResponderResult } from '../../../contracts/responder-result/responder-result-contract';
import { httpStatusStatics } from '../../../statics/http-status/http-status-statics';

export const QuestResumeResponder = async ({
  params,
}: {
  params: unknown;
}): Promise<ResponderResult> => {
  try {
    if (typeof params !== 'object' || params === null) {
      return responderResultContract.parse({
        status: httpStatusStatics.clientError.badRequest,
        data: { error: 'Invalid params' },
      });
    }
    const parsedParams = questIdParamsContract.safeParse(params);
    if (!parsedParams.success) {
      return responderResultContract.parse({
        status: httpStatusStatics.clientError.badRequest,
        data: { error: 'questId is required' },
      });
    }
    const { questId } = parsedParams.data;

    const questResult = await orchestratorGetQuestAdapter({ questId });
    if (!questResult.success || !questResult.quest) {
      return responderResultContract.parse({
        status: httpStatusStatics.clientError.badRequest,
        data: { error: 'Quest not found' },
      });
    }

    const { quest } = questResult;
    if (!isQuestResumableQuestStatusGuard({ status: quest.status })) {
      return responderResultContract.parse({
        status: httpStatusStatics.clientError.badRequest,
        data: {
          error: 'Quest must be in a resumable status (paused or blocked) to resume',
        },
      });
    }

    const result = await orchestratorResumeQuestAdapter({ questId });

    // The SAME predicate the dispatcher's own scan selects quests with
    // (scan-once-layer-broker filters on isAnyAgentRunning), so the two cannot disagree about
    // which quests the queue would run. They must stay in sync: a narrower test here declines to
    // start the queue for a quest the dispatcher would happily pick up, which is the "pressed
    // resume and watched nothing happen" failure this whole block exists to prevent — `merging`
    // is the status where they differ, and a resumed merge has a re-armed warpgate item waiting.
    const isDispatchable =
      isAnyAgentRunningQuestStatusGuard({ status: result.restoredStatus }) &&
      hasIncompleteQuestWorkGuard({
        workItems: quest.workItems,
        operations: quest.operations,
      });

    const dispatch = isDispatchable
      ? await orchestratorPlayDispatchAdapter({}).then(
          (played) => ({
            started: played.allowed,
            ...(played.reason === undefined ? {} : { reason: played.reason }),
          }),
          (error: unknown) => ({
            started: false,
            reason: error instanceof Error ? error.message : 'Failed to start dispatch',
          }),
        )
      : { started: false, reason: 'quest has no dispatchable work' };

    return responderResultContract.parse({
      status: httpStatusStatics.success.ok,
      data: { ...result, dispatch },
    });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Failed to resume quest';
    return responderResultContract.parse({
      status: httpStatusStatics.serverError.internal,
      data: { error: message },
    });
  }
};
