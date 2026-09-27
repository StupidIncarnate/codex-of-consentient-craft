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

export const GuildListResponder = async (): Promise<ResponderResult> => {
  try {
    const guilds = await StartOrchestrator.listGuilds();
    return responderResultContract.parse({ status: httpStatusStatics.success.ok, data: guilds });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Failed to list guilds';
    return responderResultContract.parse({
      status: httpStatusStatics.serverError.internal,
      data: { error: message },
    });
  }
};
