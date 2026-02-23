/**
 * PURPOSE: Handles quest list requests by validating query params and delegating to the orchestrator adapter
 *
 * USAGE:
 * const result = await QuestListResponder({ query: { guildId: 'abc-123' } });
 * // Returns { status: 200, data: quests[] } or { status: 400/500, data: { error } }
 */

import { guildIdContract } from '@dungeonmaster/shared/contracts';
import { orchestratorListQuestsAdapter } from '../../../adapters/orchestrator/list-quests/orchestrator-list-quests-adapter';
import { responderResultContract } from '../../../contracts/responder-result/responder-result-contract';
import type { ResponderResult } from '../../../contracts/responder-result/responder-result-contract';
import { httpStatusStatics } from '../../../statics/http-status/http-status-statics';

export const QuestListResponder = async ({
  query,
}: {
  query: unknown;
}): Promise<ResponderResult> => {
  try {
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
    const quests = await orchestratorListQuestsAdapter({ guildId });
    return responderResultContract.parse({ status: httpStatusStatics.success.ok, data: quests });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Failed to list quests';
    return responderResultContract.parse({
      status: httpStatusStatics.serverError.internal,
      data: { error: message },
    });
  }
};
