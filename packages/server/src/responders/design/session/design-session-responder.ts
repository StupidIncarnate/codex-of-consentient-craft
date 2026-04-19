/**
 * PURPOSE: Handles design chat session requests by delegating to the orchestrator design chat adapter
 *
 * USAGE:
 * const result = await DesignSessionResponder({ params: { questId: 'abc' }, body: { guildId: 'xyz', message: 'update color' } });
 * // Returns { status: 200, data: { chatProcessId } } or { status: 400/500, data: { error } }
 */

import { guildIdContract, questIdContract } from '@dungeonmaster/shared/contracts';
import { isDesignPhaseQuestStatusGuard } from '@dungeonmaster/shared/guards';

import { orchestratorGetQuestAdapter } from '../../../adapters/orchestrator/get-quest/orchestrator-get-quest-adapter';
import { orchestratorStartDesignChatAdapter } from '../../../adapters/orchestrator/start-design-chat/orchestrator-start-design-chat-adapter';
import { responderResultContract } from '../../../contracts/responder-result/responder-result-contract';
import type { ResponderResult } from '../../../contracts/responder-result/responder-result-contract';
import { httpStatusStatics } from '../../../statics/http-status/http-status-statics';

export const DesignSessionResponder = async ({
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

    const questIdRaw: unknown = Reflect.get(params, 'questId');
    if (typeof questIdRaw !== 'string') {
      return responderResultContract.parse({
        status: httpStatusStatics.clientError.badRequest,
        data: { error: 'questId is required' },
      });
    }

    if (typeof body !== 'object' || body === null) {
      return responderResultContract.parse({
        status: httpStatusStatics.clientError.badRequest,
        data: { error: 'Request body must be a JSON object' },
      });
    }

    const rawGuildId: unknown = Reflect.get(body, 'guildId');
    const rawMessage: unknown = Reflect.get(body, 'message');

    if (typeof rawGuildId !== 'string') {
      return responderResultContract.parse({
        status: httpStatusStatics.clientError.badRequest,
        data: { error: 'guildId is required' },
      });
    }

    if (typeof rawMessage !== 'string' || rawMessage.length === 0) {
      return responderResultContract.parse({
        status: httpStatusStatics.clientError.badRequest,
        data: { error: 'message is required' },
      });
    }

    const questId = questIdContract.parse(questIdRaw);
    const guildId = guildIdContract.parse(rawGuildId);

    const questResult = await orchestratorGetQuestAdapter({ questId: questIdRaw });
    if (!questResult.success || !questResult.quest) {
      return responderResultContract.parse({
        status: httpStatusStatics.clientError.badRequest,
        data: { error: 'Quest not found' },
      });
    }

    const { quest } = questResult;
    if (!isDesignPhaseQuestStatusGuard({ status: quest.status })) {
      return responderResultContract.parse({
        status: httpStatusStatics.clientError.badRequest,
        data: {
          error:
            'Quest must be in a design-phase status (explore_design, review_design, or design_approved) to use the design chat',
        },
      });
    }

    const { chatProcessId } = await orchestratorStartDesignChatAdapter({
      questId,
      guildId,
      message: rawMessage,
    });

    return responderResultContract.parse({
      status: httpStatusStatics.success.ok,
      data: { chatProcessId },
    });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Failed to start design chat';
    return responderResultContract.parse({
      status: httpStatusStatics.serverError.internal,
      data: { error: message },
    });
  }
};
