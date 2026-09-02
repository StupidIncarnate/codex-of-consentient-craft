/**
 * PURPOSE: The optimistic user entry the chat binding stages carries bare `[Pasted Image N]`
 * placeholders in its content string, not the bytes themselves — the renderer has nowhere else to
 * get a picture to show before the server round-trip completes. Keying by the optimistic entry's
 * own uuid, rather than the eventual transcript uuid, is deliberate: the replayed entry always
 * arrives under a different uuid, so a stale memory entry falls out of use on its own instead of
 * requiring an explicit invalidation once the served URL is available.
 *
 * USAGE:
 * pastedImageMemoryState.remember({ uuid, dataUrls });
 * pastedImageMemoryState.recall({ uuid }); // readonly ImageDataUrl[], [] when uuid is unknown
 */

import type { ChatEntryUuid } from '@dungeonmaster/shared/contracts';
import type { ImageDataUrl } from '../../contracts/image-data-url/image-data-url-contract';

const state = new Map<ChatEntryUuid, readonly ImageDataUrl[]>();

export const pastedImageMemoryState = {
  remember: ({
    uuid,
    dataUrls,
  }: {
    uuid: ChatEntryUuid;
    dataUrls: readonly ImageDataUrl[];
  }): void => {
    state.set(uuid, dataUrls);
  },

  recall: ({ uuid }: { uuid: ChatEntryUuid }): readonly ImageDataUrl[] => state.get(uuid) ?? [],

  forget: ({ uuid }: { uuid: ChatEntryUuid }): void => {
    state.delete(uuid);
  },

  clear: (): void => {
    state.clear();
  },
} as const;
