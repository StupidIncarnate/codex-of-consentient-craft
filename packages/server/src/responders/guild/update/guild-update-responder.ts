/**
 * PURPOSE: Handles guild update requests by validating params/body and delegating to the orchestrator adapter
 *
 * USAGE:
 * const result = await GuildUpdateResponder({ params: { guildId: 'abc' }, body: { name: 'New' } });
 * // Returns { status: 200, data: guild } or { status: 400/500, data: { error } }
 */

import { orchestratorUpdateGuildAdapter } from '../../../adapters/orchestrator/update-guild/orchestrator-update-guild-adapter';
import { guildIdParamsContract } from '../../../contracts/guild-id-params/guild-id-params-contract';
import { guildUpdateBodyContract } from '../../../contracts/guild-update-body/guild-update-body-contract';
import { responderResultContract } from '../../../contracts/responder-result/responder-result-contract';
import type { ResponderResult } from '../../../contracts/responder-result/responder-result-contract';
import { httpStatusStatics } from '../../../statics/http-status/http-status-statics';

export const GuildUpdateResponder = async ({
  params,
  body,
}: {
  params: unknown;
  body: unknown;
}): Promise<ResponderResult> => {
  try {
    if (typeof params !== 'object' || params === null) {
      return responderResultContract.parse({
        status: httpStatusStatics.clientError.badRequest,
        data: { error: 'Invalid params' },
      });
    }

    const parsedParams = guildIdParamsContract.safeParse(params);
    if (!parsedParams.success) {
      return responderResultContract.parse({
        status: httpStatusStatics.clientError.badRequest,
        data: { error: 'guildId is required' },
      });
    }
    const { guildId } = parsedParams.data;

    if (typeof body !== 'object' || body === null) {
      return responderResultContract.parse({
        status: httpStatusStatics.clientError.badRequest,
        data: { error: 'Request body must be a JSON object' },
      });
    }

    const parsedBody = guildUpdateBodyContract.safeParse(body);
    const name = parsedBody.success ? parsedBody.data.name : undefined;
    const path = parsedBody.success ? parsedBody.data.path : undefined;

    const guild = await orchestratorUpdateGuildAdapter({
      guildId,
      ...(name !== undefined && { name }),
      ...(path !== undefined && { path }),
    });
    return responderResultContract.parse({ status: httpStatusStatics.success.ok, data: guild });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Failed to update guild';
    return responderResultContract.parse({
      status: httpStatusStatics.serverError.internal,
      data: { error: message },
    });
  }
};
