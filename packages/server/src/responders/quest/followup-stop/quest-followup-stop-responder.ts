/**
 * PURPOSE: Handles the FOLLOW-UP tab's STOP by killing the tavernkeeper's process. Reach for this
 * rather than `QuestPauseResponder`, which is what that button used to call: pause kills every
 * process on the quest AND flips quest status to `paused`, which on a `complete` or `merged` quest
 * is not a legal transition (so it errored after the kill) and on a `blocked` one succeeded and
 * silently took the whole quest — removing the FOLLOW-UP tab, since `paused` is not
 * follow-up-chatable.
 *
 * Unlike the sibling followup POST there is no status gate here. Stopping something that is running
 * is safe at any status, and a gate would refuse exactly when a stale tab most needs to kill a
 * process it started.
 *
 * USAGE:
 * const result = await QuestFollowupStopResponder({ params: { questId } });
 * // Returns { status: 200, data: { stopped } } or { status: 400/500, data: { error } }
 */

import { orchestratorStopFollowupChatAdapter } from '../../../adapters/orchestrator/stop-followup-chat/orchestrator-stop-followup-chat-adapter';
import { questIdParamsContract } from '../../../contracts/quest-id-params/quest-id-params-contract';
import { responderResultContract } from '../../../contracts/responder-result/responder-result-contract';
import type { ResponderResult } from '../../../contracts/responder-result/responder-result-contract';
import { httpStatusStatics } from '../../../statics/http-status/http-status-statics';

export const QuestFollowupStopResponder = async ({
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

    const { stopped } = await orchestratorStopFollowupChatAdapter({ questId });

    // `stopped: false` is a 200, not an error. A STOP pressed before the spawn registered, or
    // after the turn already ended, asked for a state the quest is already in — answering 4xx
    // would render a red error entry in the transcript for a button that did its job.
    return responderResultContract.parse({
      status: httpStatusStatics.success.ok,
      data: { stopped },
    });
  } catch (error: unknown) {
    const errorMessage =
      error instanceof Error ? error.message : 'Failed to stop the follow-up chat';
    return responderResultContract.parse({
      status: httpStatusStatics.serverError.internal,
      data: { error: errorMessage },
    });
  }
};
