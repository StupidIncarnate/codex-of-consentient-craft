/**
 * PURPOSE: The chat composer's browser-only knobs — draft persistence, thumbnail markup, and the
 * toast copy shown when a paste is rejected. None of this belongs in `pastedImageStatics`: the
 * server has no composer, no localStorage and no IndexedDB, so every key here has exactly one
 * reader — the browser's paste/draft code. The byte ceiling, image cap, media-type list, and
 * placeholder pattern stay in `pastedImageStatics` because the server and orchestrator read those
 * too.
 *
 * USAGE:
 * chatComposerStatics.draftStorageKey;
 * // Returns 'dungeonmaster-chat-draft' — the localStorage key ChatInputWidget reads and writes
 */

export const chatComposerStatics = {
  draftStorageKey: 'dungeonmaster-chat-draft',
  draftDatabase: {
    name: 'dungeonmaster-chat-drafts',
    version: 1,
    storeName: 'draft-images',
  },
  thumbnail: {
    attributeName: 'data-attachment-id',
    testId: 'CHAT_INPUT_THUMBNAIL',
  },
  toasts: {
    unsupportedFormat: 'Only PNG, JPEG, GIF and WebP images can be pasted',
    tooManyImages: 'A message can carry at most 5 images',
    cannotReduce: 'That image could not be converted or reduced below 5 MB',
  },
  toastColor: 'red',
} as const;
