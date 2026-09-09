/**
 * PURPOSE: Handles quest start requests by validating params, delegating to the orchestrator
 * adapter, and starting the Node dispatcher so the started quest actually moves.
 *
 * USAGE:
 * const result = await QuestStartResponder({ params: { questId: 'abc' } });
 * // Returns { status: 200, data: { processId, dispatch: { started: true } } }
 * //   or { status: 400/500, data: { error } }
 *
 * START STARTS THE QUEUE, for the same reason resume does — see QuestResumeResponder, whose block
 * this mirrors. Starting only seeds the ledger, flips the quest to `in_progress` and enqueues it;
 * the Node dispatcher is a SEPARATE switch that normalizes to `paused` on every server boot. Left
 * independent, Begin Quest puts the quest in the queue and the dispatch loop returns immediately on
 * its own `isPlaying()` check — the user pressed the button that says Begin Quest and watched the
 * quest sit at `in_progress` with nothing picking it up.
 *
 * Unconditional here, unlike resume's gate: a START has just seeded the operations ledger and
 * enqueued the quest, so there is dispatchable work by construction. Resume needs the test because
 * it can restore a quest whose ledger is already drained.
 *
 * The exclusivity gate still owns the rest of the decision: a live `/dumpster-launch` loop keeps its
 * claim and dispatch stays paused, which is correct because that loop is already driving the queue.
 * The outcome rides back as `dispatch.started` (+ `dispatch.reason` when refused) rather than
 * failing silently. A play failure never fails the start — the quest IS started at that point.
 */

import { isStartableQuestStatusGuard } from '@dungeonmaster/shared/guards';
import { orchestratorGetQuestAdapter } from '../../../adapters/orchestrator/get-quest/orchestrator-get-quest-adapter';
import { orchestratorPlayDispatchAdapter } from '../../../adapters/orchestrator/play-dispatch/orchestrator-play-dispatch-adapter';
import { orchestratorStartQuestAdapter } from '../../../adapters/orchestrator/start-quest/orchestrator-start-quest-adapter';
import { questIdParamsContract } from '../../../contracts/quest-id-params/quest-id-params-contract';
import { responderResultContract } from '../../../contracts/responder-result/responder-result-contract';
import type { ResponderResult } from '../../../contracts/responder-result/responder-result-contract';
import { httpStatusStatics } from '../../../statics/http-status/http-status-statics';

export const QuestStartResponder = async ({
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
    if (!isStartableQuestStatusGuard({ status: quest.status })) {
      return responderResultContract.parse({
        status: httpStatusStatics.clientError.badRequest,
        data: {
          error:
            'Quest must be in a startable status (approved or design_approved) to start execution',
        },
      });
    }

    const processId = await orchestratorStartQuestAdapter({ questId });

    const dispatch = await orchestratorPlayDispatchAdapter({}).then(
      (played) => ({
        started: played.allowed,
        ...(played.reason === undefined ? {} : { reason: played.reason }),
      }),
      (error: unknown) => ({
        started: false,
        reason: error instanceof Error ? error.message : 'Failed to start dispatch',
      }),
    );

    return responderResultContract.parse({
      status: httpStatusStatics.success.ok,
      data: { processId, dispatch },
    });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Failed to start quest';
    return responderResultContract.parse({
      status: httpStatusStatics.serverError.internal,
      data: { error: message },
    });
  }
};
