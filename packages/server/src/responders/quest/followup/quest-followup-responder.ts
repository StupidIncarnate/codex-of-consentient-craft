/**
 * PURPOSE: Handles the FOLLOW-UP tab's message to the tavernkeeper by re-reading quest.json
 * status server-side before delegating to the orchestrator start-followup-chat adapter — the tab
 * stays open across visits, so a stale browser cannot spawn a session against a quest that moved
 * back to in_progress or merging since the tab was last loaded
 *
 * USAGE:
 * const result = await QuestFollowupResponder({ params: { questId }, body: { message } });
 * // Returns { status: 200, data: { chatProcessId } } or { status: 400/500, data: { error } }
 */

import { isFollowupChatableQuestStatusGuard } from '@dungeonmaster/shared/guards';

import { orchestratorFindQuestPathAdapter } from '../../../adapters/orchestrator/find-quest-path/orchestrator-find-quest-path-adapter';
import { orchestratorLoadQuestAdapter } from '../../../adapters/orchestrator/load-quest/orchestrator-load-quest-adapter';
import { orchestratorStartFollowupChatAdapter } from '../../../adapters/orchestrator/start-followup-chat/orchestrator-start-followup-chat-adapter';
import { messageBodyContract } from '../../../contracts/message-body/message-body-contract';
import { questIdParamsContract } from '../../../contracts/quest-id-params/quest-id-params-contract';
import { responderResultContract } from '../../../contracts/responder-result/responder-result-contract';
import type { ResponderResult } from '../../../contracts/responder-result/responder-result-contract';
import { httpStatusStatics } from '../../../statics/http-status/http-status-statics';

export const QuestFollowupResponder = async ({
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

    const parsedBody = messageBodyContract.safeParse(body);
    if (!parsedBody.success) {
      return responderResultContract.parse({
        status: httpStatusStatics.clientError.badRequest,
        data: { error: 'message is required' },
      });
    }
    const { message } = parsedBody.data;

    const quest = await orchestratorLoadQuestAdapter({ questId });

    // Re-check status against the freshly loaded quest, not anything the browser remembered — a
    // tab left open across a visit must not be able to spawn a session against a quest that moved
    // back to in_progress or merging since the tab was last loaded.
    if (!isFollowupChatableQuestStatusGuard({ status: quest.status })) {
      return responderResultContract.parse({
        status: httpStatusStatics.clientError.badRequest,
        data: { error: 'Quest must be blocked, complete or merged for follow-up' },
      });
    }

    // Resolve guildId via the quest path adapter — quests do not carry guildId directly.
    const { guildId } = await orchestratorFindQuestPathAdapter({ questId });

    const { chatProcessId } = await orchestratorStartFollowupChatAdapter({
      questId,
      guildId,
      message,
    });

    return responderResultContract.parse({
      status: httpStatusStatics.success.ok,
      data: { chatProcessId },
    });
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : 'Failed to start follow-up chat';
    return responderResultContract.parse({
      status: httpStatusStatics.serverError.internal,
      data: { error: errorMessage },
    });
  }
};
