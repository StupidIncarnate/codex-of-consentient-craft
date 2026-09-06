/**
 * PURPOSE: Handles design chat session requests, rewriting any pasted images to on-disk paths
 * before delegating to the orchestrator design chat adapter. Runs the image write only after the
 * quest-not-found and design-phase guards pass, so a refused send never touches disk. Reads guildId
 * off the body rather than resolving it from questId, since the design surface is the one of the
 * three send routes whose caller already has guildId from its own guild-scoped URL.
 *
 * USAGE:
 * const result = await DesignSessionResponder({ params: { questId: 'abc' }, body: { guildId: 'xyz', message: 'update color' } });
 * // Returns { status: 200, data: { chatProcessId } } or { status: 400/500, data: { error } }
 */

import { isDesignPhaseQuestStatusGuard } from '@dungeonmaster/shared/guards';

import { orchestratorGetQuestAdapter } from '../../../adapters/orchestrator/get-quest/orchestrator-get-quest-adapter';
import { orchestratorStartDesignChatAdapter } from '../../../adapters/orchestrator/start-design-chat/orchestrator-start-design-chat-adapter';
import { pastedImagePersistBroker } from '../../../brokers/pasted-image/persist/pasted-image-persist-broker';
import { guildMessageBodyContract } from '../../../contracts/guild-message-body/guild-message-body-contract';
import { questIdParamsContract } from '../../../contracts/quest-id-params/quest-id-params-contract';
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

    const parsedParams = questIdParamsContract.safeParse(params);
    if (!parsedParams.success) {
      return responderResultContract.parse({
        status: httpStatusStatics.clientError.badRequest,
        data: { error: 'questId is required' },
      });
    }
    const { questId } = parsedParams.data;

    if (typeof body !== 'object' || body === null) {
      return responderResultContract.parse({
        status: httpStatusStatics.clientError.badRequest,
        data: { error: 'Request body must be a JSON object' },
      });
    }

    const parsedBody = guildMessageBodyContract.safeParse(body);
    if (!parsedBody.success) {
      const { fieldErrors } = parsedBody.error.flatten();
      if (fieldErrors.guildId) {
        return responderResultContract.parse({
          status: httpStatusStatics.clientError.badRequest,
          data: { error: 'guildId is required' },
        });
      }
      const [firstImagesError] = fieldErrors.images ?? [];
      if (firstImagesError) {
        return responderResultContract.parse({
          status: httpStatusStatics.clientError.badRequest,
          data: { error: firstImagesError },
        });
      }
      return responderResultContract.parse({
        status: httpStatusStatics.clientError.badRequest,
        data: { error: 'message is required' },
      });
    }
    const { guildId, message, images } = parsedBody.data;

    const questResult = await orchestratorGetQuestAdapter({ questId });
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

    const rewrittenMessage =
      images !== undefined && images.length > 0
        ? await pastedImagePersistBroker({ guildId, questId, message, images })
        : message;

    const { chatProcessId } = await orchestratorStartDesignChatAdapter({
      questId,
      guildId,
      message: rewrittenMessage,
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
