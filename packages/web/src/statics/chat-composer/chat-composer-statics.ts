/**
 * PURPOSE: The chat composer's browser-only knobs — draft persistence, thumbnail markup, upload
 * progress, and the toast copy shown when a paste is rejected. None of this belongs in
 * `pastedImageStatics`: the server has no composer, no localStorage and no IndexedDB, so every key
 * here has exactly one reader — the browser's paste/draft code. The byte ceiling, image cap,
 * media-type list, and placeholder pattern stay in `pastedImageStatics` because the server and
 * orchestrator read those too. `draftDatabase.storeName` reads `webConfigStatics.pastedImage` so
 * the IndexedDB store name has one home rather than two copies that can drift.
 *
 * USAGE:
 * chatComposerStatics.draftStorageKey;
 * // Returns 'dungeonmaster-chat-draft' — the localStorage key ChatInputWidget reads and writes
 */

import { webConfigStatics } from '../web-config/web-config-statics';

export const chatComposerStatics = {
  draftStorageKey: 'dungeonmaster-chat-draft',
  draftDatabase: {
    name: 'dungeonmaster-chat-drafts',
    version: 1,
    storeName: webConfigStatics.pastedImage.draftImageStoreName,
  },
  thumbnail: {
    attributeName: 'data-attachment-id',
    testId: 'CHAT_INPUT_THUMBNAIL',
    // Bounds the RENDERED size of a pasted-image thumbnail — the attachment's own widthPx/heightPx
    // (the downscale ladder's real pixel dimensions, sent to the server) are untouched by this; it
    // only caps how large the <img> paints inline in the editor. Matches the editor's own
    // `minHeight: 60` (chat-input-widget.tsx) so a single pasted image reads as one thumbnail-sized
    // row rather than growing the composer past its own default collapsed height.
    maxHeightPx: 60,
    // Twice maxHeightPx — wide enough that a landscape image still reads as a thumbnail rather than
    // a banner spanning the composer's width.
    maxWidthPx: 120,
  },
  upload: {
    minPercent: 0,
    maxPercent: 100,
    testId: 'CHAT_INPUT_UPLOAD_PROGRESS',
  },
  toasts: {
    unsupportedFormat: 'Only PNG, JPEG, GIF and WebP images can be pasted',
    tooManyImages: 'A message can carry at most 5 images',
    cannotReduce: 'That image could not be converted or reduced below 5 MB',
  },
  toastColor: 'red',
} as const;
