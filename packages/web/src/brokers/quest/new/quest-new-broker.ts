/**
 * PURPOSE: Reach for this over questChatBroker for the very first message of a quest — no questId
 * exists yet to scope an upload to, so any pasted screenshots ride along in this one POST instead
 * of a separate per-quest upload call. Posts through the progress-reporting XHR adapter rather than
 * fetchPostAdapter because msw/node 2.12 cannot intercept XMLHttpRequest and only that adapter can
 * observe upload progress for a multi-image create.
 *
 * USAGE:
 * const { questId, chatProcessId } = await questNewBroker({ guildId, message, questType, images, onProgress });
 * // Returns { questId, chatProcessId } on success; throws the server's own rejection text otherwise
 */

import { processIdContract, questIdContract } from '@dungeonmaster/shared/contracts';
import type {
  GuildId,
  PastedImageUpload,
  ProcessId,
  QuestId,
  QuestType,
  UserInput,
} from '@dungeonmaster/shared/contracts';

import { xhrPostWithProgressAdapter } from '../../../adapters/xhr/post-with-progress/xhr-post-with-progress-adapter';
import { questNewResponseContract } from '../../../contracts/quest-new-response/quest-new-response-contract';
import type { UploadProgressHandler } from '../../../contracts/upload-progress-post/upload-progress-post-contract';
import { webConfigStatics } from '../../../statics/web-config/web-config-statics';

export const questNewBroker = async ({
  guildId,
  message,
  questType,
  images,
  onProgress,
}: {
  guildId: GuildId;
  message: UserInput;
  // Which pipeline the new quest follows. Omitted defaults to feature server-side; 'bug-hunt'
  // spawns the BugHunt intake instead of ChaosWhisperer.
  questType?: QuestType;
  images?: readonly PastedImageUpload[];
  onProgress?: UploadProgressHandler;
}): Promise<{ questId: QuestId; chatProcessId: ProcessId }> => {
  const url = webConfigStatics.api.routes.questNew.replace(':guildId', guildId);

  const result = await xhrPostWithProgressAdapter({
    url,
    body: {
      message,
      ...(questType === undefined ? {} : { questType }),
      ...(images === undefined || images.length === 0 ? {} : { images }),
    },
    onProgress: onProgress ?? ((): void => undefined),
  });
  const parsed = questNewResponseContract.safeParse(result.body);

  if (result.ok) {
    if (
      parsed.success &&
      parsed.data.questId !== undefined &&
      parsed.data.chatProcessId !== undefined
    ) {
      return {
        questId: questIdContract.parse(parsed.data.questId),
        chatProcessId: processIdContract.parse(parsed.data.chatProcessId),
      };
    }
    // A 200 carrying no usable questId/chatProcessId is a broken server contract, not a success.
    throw new Error(`POST ${url} returned 200 with no questId or chatProcessId`);
  }

  if (parsed.success && parsed.data.error !== undefined) {
    throw new Error(parsed.data.error);
  }
  throw new Error(`POST ${url} failed with status ${result.status}`);
};
