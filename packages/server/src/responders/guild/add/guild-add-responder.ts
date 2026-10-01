/**
 * PURPOSE: Handles guild creation requests by validating input and delegating to the orchestrator
 *
 * USAGE:
 * const result = await GuildAddResponder({ body: { name: 'My Guild', path: '/projects/guild' } });
 * // Returns { status: 201, data: guild } or { status: 400/409/500, data: { error } } — 400 names
 * // `path` when it is not absolute, 409 when the path is already registered to another guild
 */

import { GuildPathTakenError, StartOrchestrator } from '@dungeonmaster/orchestrator';
import { guildAbsolutePathInputContract } from '../../../contracts/guild-absolute-path-input/guild-absolute-path-input-contract';
import { guildAddBodyContract } from '../../../contracts/guild-add-body/guild-add-body-contract';
import { responderResultContract } from '../../../contracts/responder-result/responder-result-contract';
import type { ResponderResult } from '../../../contracts/responder-result/responder-result-contract';
import { httpStatusStatics } from '../../../statics/http-status/http-status-statics';
import { responderErrorDataContract } from '../../../contracts/responder-error-data/responder-error-data-contract';
import { guildContract } from '@dungeonmaster/shared/contracts';

export const GuildAddResponder = async ({ body }: { body: unknown }): Promise<ResponderResult> => {
  try {
    if (typeof body !== 'object' || body === null) {
      return responderResultContract.parse({
        status: httpStatusStatics.clientError.badRequest,
        data: responderErrorDataContract.parse({ error: 'Request body must be a JSON object' }),
      });
    }

    const parsedBody = guildAddBodyContract.safeParse(body);
    if (!parsedBody.success) {
      return responderResultContract.parse({
        status: httpStatusStatics.clientError.badRequest,
        data: responderErrorDataContract.parse({ error: 'name and path are required strings' }),
      });
    }
    const { name, path } = parsedBody.data;
    if (!guildAbsolutePathInputContract.safeParse({ path }).success) {
      return responderResultContract.parse({
        status: httpStatusStatics.clientError.badRequest,
        data: { error: 'path must be an absolute path (start with / or C:\\ on Windows)' },
      });
    }
    const result = await StartOrchestrator.addGuild({ name, path });
    return responderResultContract.parse({
      status: httpStatusStatics.success.created,
      data: guildContract.parse(result),
    });
  } catch (error: unknown) {
    const isConflict = error instanceof GuildPathTakenError;
    const message = error instanceof Error ? error.message : 'Failed to add guild';
    return responderResultContract.parse({
      status: isConflict
        ? httpStatusStatics.clientError.conflict
        : httpStatusStatics.serverError.internal,
      data: responderErrorDataContract.parse({ error: message }),
    });
  }
};
