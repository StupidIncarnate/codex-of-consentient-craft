/**
 * PURPOSE: The optimistic user entry the chat binding stages carries bare `[Pasted Image N]`
 * placeholders in its content string, not the bytes themselves — the renderer has nowhere else to
 * get a picture to show before the server round-trip completes. Keying by the optimistic entry's
 * own uuid, rather than the eventual transcript uuid, is deliberate: the replayed entry arrives
 * under a different uuid and draws from a served URL, so exactly one entry ever reads a given
 * memory slot. That one-reader property is what lets the chat binding drop a slot the moment its
 * optimistic entry is deduped out of view without any risk of blanking a picture still on screen —
 * and it has to drop it, because nothing else can reclaim multi-megabyte bytes from a Map that
 * lives as long as the tab.
 *
 * USAGE:
 * pastedImageMemoryState.remember({ uuid, dataUrls });
 * pastedImageMemoryState.recall({ uuid }); // readonly ImageDataUrl[], [] when uuid is unknown
 * pastedImageMemoryState.forget({ uuid }); // drops one entry's bytes; unknown uuid is a no-op
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
