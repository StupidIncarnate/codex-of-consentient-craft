/**
 * PURPOSE: Handles quest list requests by validating query params and delegating to the orchestrator adapter
 *
 * USAGE:
 * const result = await QuestListResponder({ query: { guildId: 'abc-123' } });
 * // Returns { status: 200, data: { quests, skipped } } or { status: 400/500, data: { error } }
 *
 * The 200 payload carries BOTH halves: the loadable quests AND every quest.json the guild scan
 * had to skip. A bare array cannot express "this list is short", which is what let an unreadable
 * quest file disappear from every surface without a word.
 */

import { orchestratorListQuestsWithSkipsAdapter } from '../../../adapters/orchestrator/list-quests-with-skips/orchestrator-list-quests-with-skips-adapter';
import { guildIdQueryContract } from '../../../contracts/guild-id-query/guild-id-query-contract';
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
    const parsedQuery = guildIdQueryContract.safeParse(query);
    if (!parsedQuery.success) {
      return responderResultContract.parse({
        status: httpStatusStatics.clientError.badRequest,
        data: { error: 'guildId query parameter is required' },
      });
    }
    const { guildId } = parsedQuery.data;
    const { quests, skipped } = await orchestratorListQuestsWithSkipsAdapter({ guildId });
    return responderResultContract.parse({
      status: httpStatusStatics.success.ok,
      data: { quests, skipped },
    });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Failed to list quests';
    return responderResultContract.parse({
      status: httpStatusStatics.serverError.internal,
      data: { error: message },
    });
  }
};
