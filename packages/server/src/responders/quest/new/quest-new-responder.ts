/**
 * PURPOSE: Handles new-quest-from-chat creation by validating input, persisting any pasted images
 * ahead of the send under a pre-minted questId, then delegating to orchestrator startChat, and
 * returning questId + chatProcessId. The image-persist step must mint its own questId here (rather
 * than reuse the chat/followup routes' pattern of persisting against an already-existing quest)
 * because the first message of a brand-new quest has no questId to persist under until this
 * responder makes one. A throw anywhere after that mint (the persist write itself, or the
 * orchestrator create that follows it) removes the folder this responder minted, because
 * `isQuestFolderGuard` accepts a bare UUID and would otherwise have `questListBroker` report the
 * orphaned images-only folder as a broken quest on every list call, forever.
 *
 * USAGE:
 * const result = await QuestNewResponder({ params: { guildId }, body: { message, images } });
 * // Returns { status: 200, data: { questId, chatProcessId } } or { status: 400/500, data: { error } }
 */

import { locationsQuestFolderPathFindBroker } from '@dungeonmaster/shared/brokers';
import { questIdContract } from '@dungeonmaster/shared/contracts';

import { fsRmAdapter } from '../../../adapters/fs/rm/fs-rm-adapter';
import { orchestratorStartChatAdapter } from '../../../adapters/orchestrator/start-chat/orchestrator-start-chat-adapter';
import { pastedImagePersistBroker } from '../../../brokers/pasted-image/persist/pasted-image-persist-broker';
import { guildIdParamsContract } from '../../../contracts/guild-id-params/guild-id-params-contract';
import { questNewBodyContract } from '../../../contracts/quest-new-body/quest-new-body-contract';
import { responderResultContract } from '../../../contracts/responder-result/responder-result-contract';
import type { ResponderResult } from '../../../contracts/responder-result/responder-result-contract';
import { httpStatusStatics } from '../../../statics/http-status/http-status-statics';

export const QuestNewResponder = async ({
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

    const parsedParams = guildIdParamsContract.safeParse(params);
    if (!parsedParams.success) {
      return responderResultContract.parse({
        status: httpStatusStatics.clientError.badRequest,
        data: { error: 'guildId is required' },
      });
    }
    const { guildId } = parsedParams.data;

    if (typeof body !== 'object' || body === null) {
      return responderResultContract.parse({
        status: httpStatusStatics.clientError.badRequest,
        data: { error: 'Request body must be a JSON object' },
      });
    }

    const parsedBody = questNewBodyContract.safeParse(body);
    if (!parsedBody.success) {
      // An `images` field error names what actually failed (over-cap array, disallowed
      // mediaType, or over-ceiling byte size) — zod's own message already carries that detail —
      // so it is surfaced verbatim rather than collapsed into the generic message-required reply
      // below, mirroring the chat and follow-up routes' own body validation.
      const imagesError = parsedBody.error.flatten().fieldErrors.images?.[0];
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
    const { message, questType, images } = parsedBody.data;

    // A pre-minted id: the create route is the one send surface where the quest does not exist
    // yet, so pasted images have nowhere to persist until this responder makes one. Only minted
    // when there is something to persist — a text-only create keeps letting the orchestrator mint
    // its own id, unchanged from before.
    const questId =
      images !== undefined && images.length > 0
        ? questIdContract.parse(crypto.randomUUID())
        : undefined;

    try {
      const rewrittenMessage =
        images === undefined || images.length === 0 || questId === undefined
          ? message
          : await pastedImagePersistBroker({ guildId, questId, message, images });

      const { chatProcessId, questId: startedQuestId } = await orchestratorStartChatAdapter({
        guildId,
        message: rewrittenMessage,
        ...(questType === undefined ? {} : { questType }),
        ...(questId === undefined ? {} : { mintedQuestId: questId }),
      });

      return responderResultContract.parse({
        status: httpStatusStatics.success.ok,
        data: {
          chatProcessId,
          ...(startedQuestId === undefined ? {} : { questId: startedQuestId }),
        },
      });
    } catch (error: unknown) {
      // Only clean up when THIS responder minted the id — a text-only create never wrote a
      // folder, and an id the orchestrator mints itself is the orchestrator's to manage.
      if (questId !== undefined) {
        const questFolderPath = locationsQuestFolderPathFindBroker({ guildId, questId });
        try {
          await fsRmAdapter({ filePath: questFolderPath, recursive: true, force: true });
        } catch (cleanupError: unknown) {
          // The create failure below is what must reach the caller — a failed cleanup is
          // logged, never thrown, so it can never mask the error that triggered it.
          process.stderr.write(
            `[quest-new-responder] failed to remove minted quest folder ${questFolderPath} after create failure: ${String(cleanupError)}\n`,
          );
        }
      }
      throw error;
    }
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : 'Failed to create new quest';
    return responderResultContract.parse({
      status: httpStatusStatics.serverError.internal,
      data: { error: errorMessage },
    });
  }
};
