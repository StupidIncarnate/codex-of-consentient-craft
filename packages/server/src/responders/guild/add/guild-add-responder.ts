/**
 * PURPOSE: Handles guild creation requests by validating input and delegating to the orchestrator adapter
 *
 * USAGE:
 * const result = await GuildAddResponder({ body: { name: 'My Guild', path: '/projects/guild' } });
 * // Returns { status: 201, data: guild } or { status: 400/500, data: { error } }
 */

import { guildNameContract, guildPathContract } from '@dungeonmaster/shared/contracts';
import { orchestratorAddGuildAdapter } from '../../../adapters/orchestrator/add-guild/orchestrator-add-guild-adapter';
import { responderResultContract } from '../../../contracts/responder-result/responder-result-contract';
import type { ResponderResult } from '../../../contracts/responder-result/responder-result-contract';
import { httpStatusStatics } from '../../../statics/http-status/http-status-statics';

export const GuildAddResponder = async ({ body }: { body: unknown }): Promise<ResponderResult> => {
  try {
    if (typeof body !== 'object' || body === null) {
      return responderResultContract.parse({
        status: httpStatusStatics.clientError.badRequest,
        data: { error: 'Request body must be a JSON object' },
      });
    }

    const rawName: unknown = Reflect.get(body, 'name');
    const rawPath: unknown = Reflect.get(body, 'path');

    if (typeof rawName !== 'string' || typeof rawPath !== 'string') {
      return responderResultContract.parse({
        status: httpStatusStatics.clientError.badRequest,
        data: { error: 'name and path are required strings' },
      });
    }

    const name = guildNameContract.parse(rawName);
    const path = guildPathContract.parse(rawPath);
    const result = await orchestratorAddGuildAdapter({ name, path });
    return responderResultContract.parse({
      status: httpStatusStatics.success.created,
      data: result,
    });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Failed to add guild';
    return responderResultContract.parse({
      status: httpStatusStatics.serverError.internal,
      data: { error: message },
    });
  }
};
