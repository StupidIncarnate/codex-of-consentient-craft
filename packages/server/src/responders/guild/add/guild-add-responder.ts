/**
 * PURPOSE: Handles guild creation requests by validating input and delegating to the orchestrator adapter
 *
 * USAGE:
 * const result = await GuildAddResponder({ body: { name: 'My Guild', path: '/projects/guild' } });
 * // Returns { status: 201, data: guild } or { status: 400/409/500, data: { error } } — 400 names
 * // `path` when it is not absolute, 409 when the path is already registered to another guild
 */

import { absoluteFilePathContract } from '@dungeonmaster/shared/contracts';

import { orchestratorAddGuildAdapter } from '../../../adapters/orchestrator/add-guild/orchestrator-add-guild-adapter';
import { guildAddBodyContract } from '../../../contracts/guild-add-body/guild-add-body-contract';
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

    const parsedBody = guildAddBodyContract.safeParse(body);
    if (!parsedBody.success) {
      return responderResultContract.parse({
        status: httpStatusStatics.clientError.badRequest,
        data: { error: 'name and path are required strings' },
      });
    }
    const { name, path } = parsedBody.data;
    // `guildPathContract` accepts any non-empty string, so this is the check that keeps a relative
    // path out of config.json — once one is there, every guild list read reports it invalid.
    if (!absoluteFilePathContract.safeParse(path).success) {
      return responderResultContract.parse({
        status: httpStatusStatics.clientError.badRequest,
        data: { error: 'path must be an absolute path (start with / or C:\\ on Windows)' },
      });
    }
    const result = await orchestratorAddGuildAdapter({ name, path });
    return responderResultContract.parse({
      status: httpStatusStatics.success.created,
      data: result,
    });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Failed to add guild';
    const isConflict = message.startsWith('A guild with path');
    return responderResultContract.parse({
      status: isConflict
        ? httpStatusStatics.clientError.conflict
        : httpStatusStatics.serverError.internal,
      data: { error: message },
    });
  }
};
