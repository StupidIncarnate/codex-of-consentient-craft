/**
 * PURPOSE: Handles per-quest chat by loading the quest, resuming it if the user paused it, persisting
 * any pasted images ahead of the send, then delegating to the orchestrator startChat adapter
 * (resuming the most-recent chat work item if one exists, else spawning a fresh chat). The
 * image-persist step runs here rather than inside startChat itself because it needs guildId and
 * questId, neither of which the orchestrator's chat adapter resolves on its own.
 *
 * USAGE:
 * const result = await QuestChatResponder({ params: { questId }, body: { message, images } });
 * // Returns { status: 200, data: { chatProcessId } } or { status: 400/500, data: { error } }
 */

import {
  isChatWorkItemRoleGuard,
  isPostQuestChatWorkItemRoleGuard,
  isUserPausedQuestStatusGuard,
} from '@dungeonmaster/shared/guards';

import { orchestratorFindQuestPathAdapter } from '../../../adapters/orchestrator/find-quest-path/orchestrator-find-quest-path-adapter';
import { orchestratorLoadQuestAdapter } from '../../../adapters/orchestrator/load-quest/orchestrator-load-quest-adapter';
import { orchestratorResumeQuestAdapter } from '../../../adapters/orchestrator/resume-quest/orchestrator-resume-quest-adapter';
import { orchestratorStartChatAdapter } from '../../../adapters/orchestrator/start-chat/orchestrator-start-chat-adapter';
import { pastedImagePersistBroker } from '../../../brokers/pasted-image/persist/pasted-image-persist-broker';
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
      // An `images` field error names what actually failed (over-cap array, disallowed
      // mediaType, or over-ceiling byte size) — zod's own message already carries that detail
      // (and, where relevant, the cap/ceiling itself), so it is surfaced verbatim rather than
      // collapsed into the generic message-required reply below.
      const { fieldErrors } = parsedBody.error.flatten();
      const [imagesError] = fieldErrors.images ?? [];
      if (imagesError !== undefined) {
        return responderResultContract.parse({
          status: httpStatusStatics.clientError.badRequest,
          data: { error: imagesError },
        });
      }
      return responderResultContract.parse({
        status: httpStatusStatics.clientError.badRequest,
        data: { error: 'message is required' },
      });
    }
    const { message, images } = parsedBody.data;

    const quest = await orchestratorLoadQuestAdapter({ questId });

    // Mirror session-chat-broker.ts pause→resume: if the user paused the quest, resume it
    // BEFORE delegating to chat-start so the user's message lands in a live chat.
    if (isUserPausedQuestStatusGuard({ status: quest.status })) {
      await orchestratorResumeQuestAdapter({ questId });
    }

    // The main composer resumes the thread it owns — spec intake (chaoswhisperer) or design
    // (glyphsmith/bughunt) — never the post-quest follow-up thread (tavernkeeper), which has its
    // own composer in its own tab talking to its own route. That thread is deliberately invisible
    // here. Chat work items never reach a terminal status, so this keys on role, never on status.
    const chatItem = quest.workItems.find(
      (wi) =>
        isChatWorkItemRoleGuard({ role: wi.role }) &&
        !isPostQuestChatWorkItemRoleGuard({ role: wi.role }) &&
        wi.sessionId,
    );
    const resolvedSessionId = chatItem?.sessionId;

    // Resolve guildId via the quest path adapter — quests do not carry guildId directly.
    const { guildId } = await orchestratorFindQuestPathAdapter({ questId });

    // Pasted images ride in the body as base64; the broker writes each to disk and rewrites the
    // message's bare placeholder tokens to the paths it wrote. A text-only send (images absent or
    // empty) skips the broker entirely and forwards the posted message as-is.
    const rewrittenMessage =
      images !== undefined && images.length > 0
        ? await pastedImagePersistBroker({ guildId, questId, message, images })
        : message;

    const { chatProcessId } = await orchestratorStartChatAdapter({
      guildId,
      message: rewrittenMessage,
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
