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

import type { PastedImageUpload, ProcessId, UserInput, Quest } from '@dungeonmaster/shared/contracts';

import { xhrPostWithProgress } from '#gateway/browser/XMLHttpRequest';

import { byteLengthContract } from '../../../contracts/byte-length/byte-length-contract';
import { questChatResponseContract } from '../../../contracts/quest-chat-response/quest-chat-response-contract';
import { uploadProgressPostContract } from '../../../contracts/upload-progress-post/upload-progress-post-contract';
import type { UploadProgressHandler } from '../../../contracts/upload-progress-post/upload-progress-post-contract';
import { webConfigStatics } from '../../../statics/web-config/web-config-statics';

export const questChatBroker = async ({
  questId,
  message,
  images,
  onProgress,
}: {
  questId: Quest['id'];
  message: UserInput;
  images?: readonly PastedImageUpload[];
  onProgress?: UploadProgressHandler;
}): Promise<{ chatProcessId: ProcessId }> => {
  const url = webConfigStatics.api.routes.questChat.replace(':questId', questId);

  const post = uploadProgressPostContract.parse({
    url,
    body: { message, ...(images === undefined || images.length === 0 ? {} : { images }) },
    onProgress: onProgress ?? ((): void => undefined),
  });

  const result = await xhrPostWithProgress({
    url: post.url,
    body: post.body,
    onProgress: ({ bytesSent, bytesTotal }): void => {
      post.onProgress({
        bytesSent: byteLengthContract.parse(bytesSent),
        bytesTotal: byteLengthContract.parse(bytesTotal),
      });
    },
  });

  // `xhrPostWithProgress` hands back the raw response text; a body that is not JSON parses as
  // itself, which the contracts below then reject.
  const parsed = ((): ReturnType<typeof questChatResponseContract.safeParse> => {
    try {
      return questChatResponseContract.safeParse(JSON.parse(result.body));
    } catch {
      return questChatResponseContract.safeParse(result.body);
    }
  })();

  if (result.ok) {
    if (parsed.success && parsed.data.chatProcessId !== undefined) {
      return { chatProcessId: parsed.data.chatProcessId };
    }
    // A 200 carrying no usable chatProcessId is a broken server contract, not a success.
    throw new Error(`POST ${url} returned 200 with no chatProcessId`);
  }

  if (parsed.success && parsed.data.error !== undefined) {
    throw new Error(parsed.data.error);
  }
  throw new Error(`POST ${url} failed with status ${result.status}`);
};
