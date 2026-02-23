/**
 * PURPOSE: Handles guild removal requests by validating params and delegating to the orchestrator adapter
 *
 * USAGE:
 * const result = await GuildRemoveResponder({ params: { guildId: 'abc-123' } });
 * // Returns { status: 200, data: { success: true } } or { status: 400/500, data: { error } }
 */

import { guildIdContract } from '@dungeonmaster/shared/contracts';
import { orchestratorRemoveGuildAdapter } from '../../../adapters/orchestrator/remove-guild/orchestrator-remove-guild-adapter';
import { responderResultContract } from '../../../contracts/responder-result/responder-result-contract';
import type { ResponderResult } from '../../../contracts/responder-result/responder-result-contract';
import { httpStatusStatics } from '../../../statics/http-status/http-status-statics';

export const GuildRemoveResponder = async ({
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
    await orchestratorRemoveGuildAdapter({ guildId });
    return responderResultContract.parse({
      status: httpStatusStatics.success.ok,
      data: { success: true },
    });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Failed to remove guild';
    return responderResultContract.parse({
      status: httpStatusStatics.serverError.internal,
      data: { error: message },
    });
  }
};
