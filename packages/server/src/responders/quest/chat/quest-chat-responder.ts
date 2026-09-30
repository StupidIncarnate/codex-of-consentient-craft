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

import { questFindQuestPathBroker, StartOrchestrator } from '@dungeonmaster/orchestrator';
import {
  isChatWorkItemRoleGuard,
  isPostQuestChatWorkItemRoleGuard,
  isUserPausedQuestStatusGuard,
} from '@dungeonmaster/shared/guards';

import { zodFirstFieldErrorMessageTransformer } from '../../../transformers/zod-first-field-error-message/zod-first-field-error-message-transformer';
import { pastedImagePersistBroker } from '../../../brokers/pasted-image/persist/pasted-image-persist-broker';
import { messageBodyContract } from '../../../contracts/message-body/message-body-contract';
import { questIdParamsContract } from '../../../contracts/quest-id-params/quest-id-params-contract';
import { responderResultContract } from '../../../contracts/responder-result/responder-result-contract';
import type { ResponderResult } from '../../../contracts/responder-result/responder-result-contract';
import { httpStatusStatics } from '../../../statics/http-status/http-status-statics';
import { responderErrorDataContract } from '../../../contracts/responder-error-data/responder-error-data-contract';
import { questChatResponseDataContract } from '../../../contracts/quest-chat-response-data/quest-chat-response-data-contract';

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
        data: responderErrorDataContract.parse({ error: 'Invalid params' }),
      });
    }

    const parsedParams = questIdParamsContract.safeParse(params);
    if (!parsedParams.success) {
      return responderResultContract.parse({
        status: httpStatusStatics.clientError.badRequest,
        data: responderErrorDataContract.parse({ error: 'questId is required' }),
      });
    }
    const { questId } = parsedParams.data;

    if (typeof body !== 'object' || body === null) {
      return responderResultContract.parse({
        status: httpStatusStatics.clientError.badRequest,
        data: responderErrorDataContract.parse({ error: 'Request body must be a JSON object' }),
      });
    }

    const parsedBody = messageBodyContract.safeParse(body);
    if (!parsedBody.success) {
      // An `images` field error names what actually failed (over-cap array, disallowed
      // mediaType, or over-ceiling byte size) — zod's own message already carries that detail
      // (and, where relevant, the cap/ceiling itself), so it is surfaced verbatim rather than
      // collapsed into the generic message-required reply below.
      const imagesError = zodFirstFieldErrorMessageTransformer({
        error: parsedBody.error,
        field: 'images',
      });
      if (imagesError !== undefined) {
        return responderResultContract.parse({
          status: httpStatusStatics.clientError.badRequest,
          data: responderErrorDataContract.parse({ error: imagesError }),
        });
      }
      return responderResultContract.parse({
        status: httpStatusStatics.clientError.badRequest,
        data: responderErrorDataContract.parse({ error: 'message is required' }),
      });
    }
    const { message, images } = parsedBody.data;

    const quest = await StartOrchestrator.loadQuest({ questId });

    // Mirror session-chat-broker.ts pause→resume: if the user paused the quest, resume it
    // BEFORE delegating to chat-start so the user's message lands in a live chat.
    if (isUserPausedQuestStatusGuard({ status: quest.status })) {
      await StartOrchestrator.resumeQuest({ questId });
    }

    // The main composer resumes the thread it owns — spec intake (chaoswhisperer) or bug-hunt
    // intake (bughunt) — never the post-quest follow-up thread (tavernkeeper), which has its
    // own composer in its own tab talking to its own route. That thread is deliberately invisible
    // here. Chat work items never reach a terminal status, so this keys on role, never on status.
    const chatItem = quest.workItems.find(
      (wi) =>
        isChatWorkItemRoleGuard({ role: wi.role }) &&
        !isPostQuestChatWorkItemRoleGuard({ role: wi.role }) &&
        wi.sessionId,
    );
    const resolvedSessionId = chatItem?.sessionId;

    // Resolve guildId via the quest path broker — quests do not carry guildId directly.
    const { guildId } = await questFindQuestPathBroker({ questId });

    // Pasted images ride in the body as base64, and a screenshot's absolute local path can ride in
    // the text alone with no images key at all — the broker scans every send for both, so the call
    // is unconditional here. Its own early return (see its header) is what keeps a plain-text send
    // from touching the filesystem.
    const rewrittenMessage = await pastedImagePersistBroker({
      guildId,
      questId,
      message,
      images: images ?? [],
    });

    // The URL already names this quest, and it was loaded off disk above — so it is never a
    // guess. Passing it as `existingQuestId` (rather than relying solely on the sessionId-derived
    // resume hint) is what stops the orchestrator's resolution from minting a brand-new quest
    // during the window before a freshly spawned chat's sessionId has been written back to this
    // quest's own work item — see resolveChatQuestLayerBroker's header. The images persisted above
    // already live under this exact questId, so this can never spawn into a different quest than
    // the one it wrote them to.
    const { chatProcessId } = await StartOrchestrator.startChat({
      guildId,
      message: rewrittenMessage,
      existingQuestId: questId,
      ...(resolvedSessionId === undefined ? {} : { sessionId: resolvedSessionId }),
    });

    return responderResultContract.parse({
      status: httpStatusStatics.success.ok,
      data: questChatResponseDataContract.parse({ chatProcessId }),
    });
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : 'Failed to start quest chat';
    return responderResultContract.parse({
      status: httpStatusStatics.serverError.internal,
      data: responderErrorDataContract.parse({ error: errorMessage }),
    });
  }
};
