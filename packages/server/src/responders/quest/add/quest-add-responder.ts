/**
 * PURPOSE: Handles quest creation requests by validating input and delegating to the orchestrator adapter
 *
 * USAGE:
 * const result = await QuestAddResponder({ body: { title: 'My Quest', userRequest: 'Do X', guildId: 'abc' } });
 * // Returns { status: 201, data: result } or { status: 400/500, data: { error } }
 */

import { guildIdContract } from '@dungeonmaster/shared/contracts';
import { orchestratorAddQuestAdapter } from '../../../adapters/orchestrator/add-quest/orchestrator-add-quest-adapter';
import { responderResultContract } from '../../../contracts/responder-result/responder-result-contract';
import type { ResponderResult } from '../../../contracts/responder-result/responder-result-contract';
import { httpStatusStatics } from '../../../statics/http-status/http-status-statics';

export const QuestAddResponder = async ({ body }: { body: unknown }): Promise<ResponderResult> => {
  try {
    if (typeof body !== 'object' || body === null) {
      return responderResultContract.parse({
        status: httpStatusStatics.clientError.badRequest,
        data: { error: 'Request body must be a JSON object' },
      });
    }

    const title: unknown = Reflect.get(body, 'title');
    const userRequest: unknown = Reflect.get(body, 'userRequest');
    const guildIdRaw: unknown = Reflect.get(body, 'guildId');

    if (typeof title !== 'string' || typeof userRequest !== 'string') {
      return responderResultContract.parse({
        status: httpStatusStatics.clientError.badRequest,
        data: { error: 'title and userRequest are required strings' },
      });
    }

    if (typeof guildIdRaw !== 'string') {
      return responderResultContract.parse({
        status: httpStatusStatics.clientError.badRequest,
        data: { error: 'guildId is required' },
      });
    }

    const guildId = guildIdContract.parse(guildIdRaw);
    const result = await orchestratorAddQuestAdapter({ title, userRequest, guildId });
    return responderResultContract.parse({
      status: httpStatusStatics.success.created,
      data: result,
    });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Failed to add quest';
    return responderResultContract.parse({
      status: httpStatusStatics.serverError.internal,
      data: { error: message },
    });
  }
};
