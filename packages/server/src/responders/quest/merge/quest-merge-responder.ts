/**
 * PURPOSE: Handles the "Teleport with Booty (Merge)" button's POST by re-reading quest.json status
 * server-side before delegating to `StartOrchestrator.mergeQuest` — the execution tab stays open
 * across visits, so a stale browser cannot re-merge a quest that already merged, or start one on a
 * quest that went back to running
 *
 * USAGE:
 * const result = await QuestMergeResponder({ params: { questId } });
 * // Returns { status: 200, data: { merging } } or { status: 400/500, data: { error } }
 */

import { StartOrchestrator } from '@dungeonmaster/orchestrator';
import { isMergeableQuestStatusGuard } from '@dungeonmaster/shared/guards';

import { questIdParamsContract } from '../../../contracts/quest-id-params/quest-id-params-contract';
import { responderResultContract } from '../../../contracts/responder-result/responder-result-contract';
import type { ResponderResult } from '../../../contracts/responder-result/responder-result-contract';
import { httpStatusStatics } from '../../../statics/http-status/http-status-statics';
import { responderErrorDataContract } from '../../../contracts/responder-error-data/responder-error-data-contract';
import { questMergeResponseDataContract } from '../../../contracts/quest-merge-response-data/quest-merge-response-data-contract';

export const QuestMergeResponder = async ({
  params,
}: {
  params: unknown;
}): Promise<ResponderResult> => {
  try {
    if (typeof params !== 'object' || params === null) {
      return responderResultContract.parse({
        status: httpStatusStatics.clientError.badRequest,
        data: responderErrorDataContract.parse({ error: 'Invalid params' }),
      });
    }
    const parsedParams = questIdParamsContract.safeParse(params);
    if (!parsedParams.success) {
      return responderResultContract.parse({
        status: httpStatusStatics.clientError.badRequest,
        data: responderErrorDataContract.parse({ error: 'questId is required' }),
      });
    }
    const { questId } = parsedParams.data;

    const questResult = await StartOrchestrator.getQuest({ questId });
    if (!questResult.success || !questResult.quest) {
      return responderResultContract.parse({
        status: httpStatusStatics.clientError.badRequest,
        data: responderErrorDataContract.parse({ error: 'Quest not found' }),
      });
    }

    const { quest } = questResult;
    // Re-read status against the freshly loaded quest, not anything the browser remembered — the
    // action bar sits on a tab that stays open across visits, so a stale tab must not be able to
    // re-merge a quest that already merged, or start one on a quest that went back to running.
    if (!isMergeableQuestStatusGuard({ status: quest.status })) {
      return responderResultContract.parse({
        status: httpStatusStatics.clientError.badRequest,
        data: responderErrorDataContract.parse({
          error: 'Quest must be blocked or complete to merge',
        }),
      });
    }

    const { merging } = await StartOrchestrator.mergeQuest({ questId });
    return responderResultContract.parse({
      status: httpStatusStatics.success.ok,
      data: questMergeResponseDataContract.parse({ merging }),
    });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Failed to start merge';
    return responderResultContract.parse({
      status: httpStatusStatics.serverError.internal,
      data: responderErrorDataContract.parse({ error: message }),
    });
  }
};
