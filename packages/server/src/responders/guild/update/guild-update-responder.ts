/**
 * PURPOSE: Handles guild update requests by validating params/body and delegating to the orchestrator
 *
 * USAGE:
 * const result = await GuildUpdateResponder({ params: { guildId: 'abc' }, body: { name: 'New' } });
 * // Returns { status: 200, data: guild } or { status: 400/409/500, data: { error } } — 400 names
 * // `path` when it is not absolute, 409 when the new path is already registered to another guild
 */

import { GuildPathTakenError, StartOrchestrator } from '@dungeonmaster/orchestrator';
import { guildAbsolutePathInputContract } from '../../../contracts/guild-absolute-path-input/guild-absolute-path-input-contract';
import { guildIdParamsContract } from '../../../contracts/guild-id-params/guild-id-params-contract';
import { guildUpdateBodyContract } from '../../../contracts/guild-update-body/guild-update-body-contract';
import { responderResultContract } from '../../../contracts/responder-result/responder-result-contract';
import type { ResponderResult } from '../../../contracts/responder-result/responder-result-contract';
import { httpStatusStatics } from '../../../statics/http-status/http-status-statics';
import { responderErrorDataContract } from '../../../contracts/responder-error-data/responder-error-data-contract';
import { guildContract } from '@dungeonmaster/shared/contracts';

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

    if (typeof body !== 'object' || body === null) {
      return responderResultContract.parse({
        status: httpStatusStatics.clientError.badRequest,
        data: responderErrorDataContract.parse({ error: 'Request body must be a JSON object' }),
      });
    }

    const parsedBody = guildUpdateBodyContract.safeParse(body);
    const name = parsedBody.success ? parsedBody.data.name : undefined;
    const path = parsedBody.success ? parsedBody.data.path : undefined;

    if (path !== undefined && !guildAbsolutePathInputContract.safeParse({ path }).success) {
      return responderResultContract.parse({
        status: httpStatusStatics.clientError.badRequest,
        data: { error: 'path must be an absolute path (start with / or C:\\ on Windows)' },
      });
    }

    const guild = await StartOrchestrator.updateGuild({
      guildId,
      ...(name !== undefined && { name }),
      ...(path !== undefined && { path }),
    });
    return responderResultContract.parse({
      status: httpStatusStatics.success.ok,
      data: guildContract.parse(guild),
    });
  } catch (error: unknown) {
    const isConflict = error instanceof GuildPathTakenError;
    const message = error instanceof Error ? error.message : 'Failed to update guild';
    return responderResultContract.parse({
      status: isConflict
        ? httpStatusStatics.clientError.conflict
        : httpStatusStatics.serverError.internal,
      data: responderErrorDataContract.parse({ error: message }),
    });
  }
};
