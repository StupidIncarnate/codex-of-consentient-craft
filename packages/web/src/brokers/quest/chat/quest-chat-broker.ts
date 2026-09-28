/**
 * PURPOSE: Reach for this over questFollowupBroker for the main quest workspace's mid-quest send,
 * which posts to the quest chat route; the finished-quest FOLLOW-UP tab's tavernkeeper thread posts
 * through questFollowupBroker to the follow-up route instead. Images are appended only when present
 * so a text-only send matches the server's `images?` contract field exactly rather than sending an
 * empty array.
 *
 * USAGE:
 * const { chatProcessId } = await questChatBroker({ questId, message, images, onProgress });
 * // Returns { chatProcessId } on success; throws the server's exact rejection text otherwise
 */

import { processIdContract } from '@dungeonmaster/shared/contracts';
import type {
  PastedImageUpload,
  ProcessId,
  QuestId,
  UserInput,
} from '@dungeonmaster/shared/contracts';

import { xhrPostWithProgress } from '#gateway/browser/XMLHttpRequest';

import { byteLengthContract } from '../../../contracts/byte-length/byte-length-contract';
import { errorBodyContract } from '../../../contracts/error-body/error-body-contract';
import type { UploadProgressHandler } from '../../../contracts/upload-progress-post/upload-progress-post-contract';
import { webConfigStatics } from '../../../statics/web-config/web-config-statics';

export const questChatBroker = async ({
  questId,
  message,
  images,
  onProgress,
}: {
  questId: QuestId;
  message: UserInput;
  images?: readonly PastedImageUpload[];
  onProgress?: UploadProgressHandler;
}): Promise<{ chatProcessId: ProcessId }> => {
  const url = webConfigStatics.api.routes.questChat.replace(':questId', questId);

  const result = await xhrPostWithProgress({
    url,
    body: { message, ...(images === undefined || images.length === 0 ? {} : { images }) },
    onProgress: ({ bytesSent, bytesTotal }): void => {
      onProgress?.({
        bytesSent: byteLengthContract.parse(bytesSent),
        bytesTotal: byteLengthContract.parse(bytesTotal),
      });
    },
  });

  // `xhrPostWithProgress` hands back the raw response text; a body that is not JSON parses as
  // itself, which the contracts below then reject.
  let parsedBody: unknown = null;
  if (result.body.length > 0) {
    try {
      parsedBody = JSON.parse(result.body) as unknown;
    } catch {
      parsedBody = result.body;
    }
  }

  if (result.ok) {
    const chatProcessIdValue =
      typeof parsedBody === 'object' && parsedBody !== null && 'chatProcessId' in parsedBody
        ? parsedBody.chatProcessId
        : undefined;
    const parsed = processIdContract.safeParse(chatProcessIdValue);
    if (parsed.success) {
      return { chatProcessId: parsed.data };
    }
    // A 200 carrying no usable chatProcessId is a broken server contract, not a success.
    throw new Error(`POST ${url} returned 200 with no chatProcessId`);
  }

  const errorParsed = errorBodyContract.safeParse(parsedBody);
  if (errorParsed.success) {
    throw new Error(errorParsed.data.error);
  }
  throw new Error(`POST ${url} failed with status ${result.status}`);
};
