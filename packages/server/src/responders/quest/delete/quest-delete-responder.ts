/**
 * PURPOSE: Handles quest delete requests by validating params and delegating to the orchestrator adapter. Rejects when the quest is actively executing.
 *
 * USAGE:
 * const result = await QuestDeleteResponder({ params: { questId: 'abc' }, query: { guildId: 'xyz' } });
 * // Returns { status: 200, data: { deleted: true } } or { status: 400/500, data: { error } }
 */

import { guildIdContract, questIdContract } from '@dungeonmaster/shared/contracts';
import {
  isPreExecutionQuestStatusGuard,
  isTerminalQuestStatusGuard,
  isUserPausedQuestStatusGuard,
} from '@dungeonmaster/shared/guards';

import { orchestratorDeleteQuestAdapter } from '../../../adapters/orchestrator/delete-quest/orchestrator-delete-quest-adapter';
import { orchestratorGetQuestAdapter } from '../../../adapters/orchestrator/get-quest/orchestrator-get-quest-adapter';
import { responderResultContract } from '../../../contracts/responder-result/responder-result-contract';
import type { ResponderResult } from '../../../contracts/responder-result/responder-result-contract';
import { httpStatusStatics } from '../../../statics/http-status/http-status-statics';

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
        data: { error: 'Invalid params' },
      });
    }
    const questIdRaw: unknown = Reflect.get(params, 'questId');
    if (typeof questIdRaw !== 'string') {
      return responderResultContract.parse({
        status: httpStatusStatics.clientError.badRequest,
        data: { error: 'questId is required' },
      });
    }
    const questId = questIdContract.parse(questIdRaw);

    if (typeof query !== 'object' || query === null) {
      return responderResultContract.parse({
        status: httpStatusStatics.clientError.badRequest,
        data: { error: 'Invalid query' },
      });
    }
    const guildIdRaw: unknown = Reflect.get(query, 'guildId');
    if (typeof guildIdRaw !== 'string') {
      return responderResultContract.parse({
        status: httpStatusStatics.clientError.badRequest,
        data: { error: 'guildId query parameter is required' },
      });
    }
    const guildId = guildIdContract.parse(guildIdRaw);

    const questResult = await orchestratorGetQuestAdapter({ questId: questIdRaw });
    if (!questResult.success || !questResult.quest) {
      return responderResultContract.parse({
        status: httpStatusStatics.clientError.badRequest,
        data: { error: 'Quest not found' },
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
        data: { error: QUEST_DELETE_REJECTED_ERROR },
      });
    }

    const result = await orchestratorDeleteQuestAdapter({ questId, guildId });
    return responderResultContract.parse({
      status: httpStatusStatics.success.ok,
      data: result,
    });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Failed to delete quest';
    return responderResultContract.parse({
      status: httpStatusStatics.serverError.internal,
      data: { error: message },
    });
  }
};
