/**
 * PURPOSE: Handles guild retrieval requests by validating params and delegating to the orchestrator adapter
 *
 * USAGE:
 * const result = await GuildGetResponder({ params: { guildId: 'abc-123' } });
 * // Returns { status: 200, data: guild } or { status: 400/500, data: { error } }
 */

import { StartOrchestrator } from '@dungeonmaster/orchestrator';
import { guildIdParamsContract } from '../../../contracts/guild-id-params/guild-id-params-contract';
import { responderResultContract } from '../../../contracts/responder-result/responder-result-contract';
import type { ResponderResult } from '../../../contracts/responder-result/responder-result-contract';
import { httpStatusStatics } from '../../../statics/http-status/http-status-statics';
import { responderErrorDataContract } from '../../../contracts/responder-error-data/responder-error-data-contract';
import { guildContract } from '@dungeonmaster/shared/contracts';

export const GuildGetResponder = async ({
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

    const parsedParams = guildIdParamsContract.safeParse(params);
    if (!parsedParams.success) {
      return responderResultContract.parse({
        status: httpStatusStatics.clientError.badRequest,
        data: responderErrorDataContract.parse({ error: 'guildId is required' }),
      });
    }
    const { guildId } = parsedParams.data;
    const guild = await StartOrchestrator.getGuild({ guildId });
    return responderResultContract.parse({
      status: httpStatusStatics.success.ok,
      data: guildContract.parse(guild),
    });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Failed to get guild';
    const isNotFound = message.startsWith('Guild not found');
    return responderResultContract.parse({
      status: isNotFound
        ? httpStatusStatics.clientError.notFound
        : httpStatusStatics.serverError.internal,
      data: responderErrorDataContract.parse({ error: message }),
    });
  }
};
