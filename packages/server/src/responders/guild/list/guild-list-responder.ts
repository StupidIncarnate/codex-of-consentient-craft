/**
 * PURPOSE: Handles guild list requests by delegating to the orchestrator adapter
 *
 * USAGE:
 * const result = await GuildListResponder();
 * // Returns { status: 200, data: guilds[] } or { status: 500, data: { error } }
 */

import { StartOrchestrator } from '@dungeonmaster/orchestrator';
import { responderResultContract } from '../../../contracts/responder-result/responder-result-contract';
import type { ResponderResult } from '../../../contracts/responder-result/responder-result-contract';
import { httpStatusStatics } from '../../../statics/http-status/http-status-statics';
import { responderErrorDataContract } from '../../../contracts/responder-error-data/responder-error-data-contract';
import { guildListResponseDataContract } from '../../../contracts/guild-list-response-data/guild-list-response-data-contract';

export const GuildListResponder = async (): Promise<ResponderResult> => {
  try {
    const guilds = await StartOrchestrator.listGuilds();
    return responderResultContract.parse({ status: httpStatusStatics.success.ok, data: guildListResponseDataContract.parse(guilds) });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Failed to list guilds';
    return responderResultContract.parse({
      status: httpStatusStatics.serverError.internal,
      data: responderErrorDataContract.parse({ error: message }),
    });
  }
};
