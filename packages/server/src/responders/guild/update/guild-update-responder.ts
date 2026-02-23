/**
 * PURPOSE: Handles guild update requests by validating params/body and delegating to the orchestrator adapter
 *
 * USAGE:
 * const result = await GuildUpdateResponder({ params: { guildId: 'abc' }, body: { name: 'New' } });
 * // Returns { status: 200, data: guild } or { status: 400/500, data: { error } }
 */

import {
  guildIdContract,
  guildNameContract,
  guildPathContract,
} from '@dungeonmaster/shared/contracts';
import { orchestratorUpdateGuildAdapter } from '../../../adapters/orchestrator/update-guild/orchestrator-update-guild-adapter';
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

    const guildIdRaw: unknown = Reflect.get(params, 'guildId');

    if (typeof guildIdRaw !== 'string') {
      return responderResultContract.parse({
        status: httpStatusStatics.clientError.badRequest,
        data: { error: 'guildId is required' },
      });
    }

    const guildId = guildIdContract.parse(guildIdRaw);

    if (typeof body !== 'object' || body === null) {
      return responderResultContract.parse({
        status: httpStatusStatics.clientError.badRequest,
        data: { error: 'Request body must be a JSON object' },
      });
    }

    const rawName: unknown = Reflect.get(body, 'name');
    const rawPath: unknown = Reflect.get(body, 'path');

    const guild = await orchestratorUpdateGuildAdapter({
      guildId,
      ...(typeof rawName === 'string' && { name: guildNameContract.parse(rawName) }),
      ...(typeof rawPath === 'string' && { path: guildPathContract.parse(rawPath) }),
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
