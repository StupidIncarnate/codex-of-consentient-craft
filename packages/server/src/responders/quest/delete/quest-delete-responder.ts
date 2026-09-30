/**
 * PURPOSE: Handles quest delete requests by validating params and delegating to the orchestrator adapter. Rejects when the quest is actively executing.
 *
 * USAGE:
 * const result = await QuestDeleteResponder({ params: { questId: 'abc' }, query: { guildId: 'xyz' } });
 * // Returns { status: 200, data: { deleted: true } } or { status: 400/500, data: { error } }
 */

import { StartOrchestrator } from '@dungeonmaster/orchestrator';
import {
  isPreExecutionQuestStatusGuard,
  isTerminalQuestStatusGuard,
  isUserPausedQuestStatusGuard,
} from '@dungeonmaster/shared/guards';

import { guildIdQueryContract } from '../../../contracts/guild-id-query/guild-id-query-contract';
import { questIdParamsContract } from '../../../contracts/quest-id-params/quest-id-params-contract';
import { responderResultContract } from '../../../contracts/responder-result/responder-result-contract';
import type { ResponderResult } from '../../../contracts/responder-result/responder-result-contract';
import { httpStatusStatics } from '../../../statics/http-status/http-status-statics';
import { responderErrorDataContract } from '../../../contracts/responder-error-data/responder-error-data-contract';
import { questDeleteResponseDataContract } from '../../../contracts/quest-delete-response-data/quest-delete-response-data-contract';

const QUEST_DELETE_REJECTED_ERROR =
  'Quest must be in a terminal, paused, or pre-execution status to delete. Pause or abandon the quest first.';

export const QuestDeleteResponder = async ({
  params,
  query,
}: {
  params: unknown;
  query: unknown;
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

    if (typeof query !== 'object' || query === null) {
      return responderResultContract.parse({
        status: httpStatusStatics.clientError.badRequest,
        data: responderErrorDataContract.parse({ error: 'Invalid query' }),
      });
    }
    const parsedQuery = guildIdQueryContract.safeParse(query);
    if (!parsedQuery.success) {
      return responderResultContract.parse({
        status: httpStatusStatics.clientError.badRequest,
        data: responderErrorDataContract.parse({ error: 'guildId query parameter is required' }),
      });
    }
    const { guildId } = parsedQuery.data;

    const questResult = await StartOrchestrator.getQuest({ questId });
    if (!questResult.success || !questResult.quest) {
      return responderResultContract.parse({
        status: httpStatusStatics.clientError.badRequest,
        data: responderErrorDataContract.parse({ error: 'Quest not found' }),
      });
    }

    const { quest } = questResult;
    const isDeletable =
      isTerminalQuestStatusGuard({ status: quest.status }) ||
      isUserPausedQuestStatusGuard({ status: quest.status }) ||
      isPreExecutionQuestStatusGuard({ status: quest.status });

    if (!isDeletable) {
      return responderResultContract.parse({
        status: httpStatusStatics.clientError.badRequest,
        data: responderErrorDataContract.parse({ error: QUEST_DELETE_REJECTED_ERROR }),
      });
    }

    const result = await StartOrchestrator.deleteQuest({ questId, guildId });
    return responderResultContract.parse({
      status: httpStatusStatics.success.ok,
      data: questDeleteResponseDataContract.parse(result),
    });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Failed to delete quest';
    return responderResultContract.parse({
      status: httpStatusStatics.serverError.internal,
      data: responderErrorDataContract.parse({ error: message }),
    });
  }
};
