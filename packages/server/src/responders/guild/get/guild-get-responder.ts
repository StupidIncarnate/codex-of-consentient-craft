/**
 * PURPOSE: Handles guild retrieval requests by validating params and delegating to the orchestrator adapter
 *
 * USAGE:
 * const result = await GuildGetResponder({ params: { guildId: 'abc-123' } });
 * // Returns { status: 200, data: guild } or { status: 400/500, data: { error } }
 */

import { guildIdContract } from '@dungeonmaster/shared/contracts';
import { orchestratorGetGuildAdapter } from '../../../adapters/orchestrator/get-guild/orchestrator-get-guild-adapter';
import { responderResultContract } from '../../../contracts/responder-result/responder-result-contract';
import type { ResponderResult } from '../../../contracts/responder-result/responder-result-contract';
import { httpStatusStatics } from '../../../statics/http-status/http-status-statics';

export const GuildGetResponder = async ({
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
    const guild = await orchestratorGetGuildAdapter({ guildId });
    return responderResultContract.parse({ status: httpStatusStatics.success.ok, data: guild });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Failed to get guild';
    return responderResultContract.parse({
      status: httpStatusStatics.serverError.internal,
      data: { error: message },
    });
  }
};
