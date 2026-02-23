/**
 * PURPOSE: Handles session list requests by validating params and delegating to the session list broker
 *
 * USAGE:
 * const result = await SessionListResponder({ params: { guildId: 'abc-123' } });
 * // Returns { status: 200, data: sessions } or { status: 400/500, data: { error } }
 */

import { guildIdContract } from '@dungeonmaster/shared/contracts';
import { sessionListBroker } from '../../../brokers/session/list/session-list-broker';
import { sessionSummaryCacheState } from '../../../state/session-summary-cache/session-summary-cache-state';
import { responderResultContract } from '../../../contracts/responder-result/responder-result-contract';
import type { ResponderResult } from '../../../contracts/responder-result/responder-result-contract';
import { httpStatusStatics } from '../../../statics/http-status/http-status-statics';

export const SessionListResponder = async ({
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

    const guildIdRaw: unknown = Reflect.get(params, 'guildId');

    if (typeof guildIdRaw !== 'string') {
      return responderResultContract.parse({
        status: httpStatusStatics.clientError.badRequest,
        data: { error: 'guildId is required' },
      });
    }

    const guildId = guildIdContract.parse(guildIdRaw);
    const sessions = await sessionListBroker({
      guildId,
      getCache: sessionSummaryCacheState.get,
      setCache: sessionSummaryCacheState.set,
    });

    return responderResultContract.parse({
      status: httpStatusStatics.success.ok,
      data: sessions,
    });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Failed to list sessions';
    return responderResultContract.parse({
      status: httpStatusStatics.serverError.internal,
      data: { error: message },
    });
  }
};
