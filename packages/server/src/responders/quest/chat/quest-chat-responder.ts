/**
 * PURPOSE: Handles per-quest chat by loading the quest, resuming it if the user paused it, then delegating to the orchestrator startChat adapter (resuming the most-recent chat work item if one exists, else spawning a fresh chat)
 *
 * USAGE:
 * const result = await QuestChatResponder({ params: { questId }, body: { message } });
 * // Returns { status: 200, data: { chatProcessId } } or { status: 400/500, data: { error } }
 */

import { isUserPausedQuestStatusGuard } from '@dungeonmaster/shared/guards';

import { orchestratorFindQuestPathAdapter } from '../../../adapters/orchestrator/find-quest-path/orchestrator-find-quest-path-adapter';
import { orchestratorLoadQuestAdapter } from '../../../adapters/orchestrator/load-quest/orchestrator-load-quest-adapter';
import { orchestratorResumeQuestAdapter } from '../../../adapters/orchestrator/resume-quest/orchestrator-resume-quest-adapter';
import { orchestratorStartChatAdapter } from '../../../adapters/orchestrator/start-chat/orchestrator-start-chat-adapter';
import { messageBodyContract } from '../../../contracts/message-body/message-body-contract';
import { questIdParamsContract } from '../../../contracts/quest-id-params/quest-id-params-contract';
import { responderResultContract } from '../../../contracts/responder-result/responder-result-contract';
import type { ResponderResult } from '../../../contracts/responder-result/responder-result-contract';
import { httpStatusStatics } from '../../../statics/http-status/http-status-statics';

export const QuestChatResponder = async ({
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

    // Mirror session-chat-broker.ts pause→resume: if the user paused the quest, resume it
    // BEFORE delegating to chat-start so the user's message lands in a live chat.
    if (isUserPausedQuestStatusGuard({ status: quest.status })) {
      await orchestratorResumeQuestAdapter({ questId });
    }

    // Prefer the chat work item (chaoswhisperer/glyphsmith) sessionId over generic active session.
    // The chat input always resumes the most-recent chat thread the user has been talking to.
    const chatItem = quest.workItems.find(
      (wi) => (wi.role === 'chaoswhisperer' || wi.role === 'glyphsmith') && wi.sessionId,
    );
    const resolvedSessionId = chatItem?.sessionId;

    // Resolve guildId via the quest path adapter — quests do not carry guildId directly.
    const { guildId } = await orchestratorFindQuestPathAdapter({ questId });

    const { chatProcessId } = await orchestratorStartChatAdapter({
      guildId,
      message,
      ...(resolvedSessionId === undefined ? {} : { sessionId: resolvedSessionId }),
    });

    return responderResultContract.parse({
      status: httpStatusStatics.success.ok,
      data: { chatProcessId },
    });
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : 'Failed to start quest chat';
    return responderResultContract.parse({
      status: httpStatusStatics.serverError.internal,
      data: { error: errorMessage },
    });
  }
};
