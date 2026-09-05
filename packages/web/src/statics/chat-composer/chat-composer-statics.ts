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
 * chatComposerStatics.draftStorageKeyPrefix;
 * // Returns 'dungeonmaster-chat-draft' — combined with a ComposerScopeKey ("<prefix>:<scopeKey>")
 * // this is the localStorage key ChatInputWidget reads and writes. Read alone (no suffix) it is
 * // also the PRE-SCOPING global key a one-time migration adopts into the create surface's scope.
 */

import { webConfigStatics } from '../web-config/web-config-statics';

export const chatComposerStatics = {
  // Read alone, this is the legacy (pre-scoping) global draft key — see the USAGE note above.
  // Combined with a scope key ("<prefix>:<scopeKey>") it is the current, per-composer key.
  draftStorageKeyPrefix: 'dungeonmaster-chat-draft',
  // Combined with a scope key ("<prefix>:<scopeKey>") this is the "this draft's send already left
  // the browser" stamp — see chat-input-widget.tsx's handleSend/restoreDraft. Written to
  // localStorage synchronously, before the outgoing request, so it durably survives a page reload
  // that outruns the response; cleared the instant this document learns the outcome (accepted OR
  // rejected). A restore that still finds the stamp set never learned that outcome in THIS
  // document — most often because the page reloaded before the response arrived — and treats the
  // draft as already delivered rather than re-offering content the transcript may already show as
  // sent. A separate top-level key rather than folded into the text draft's own value: the text
  // key's raw string IS the persisted draft (composer-paste-draft-reload.e2e.ts reads it directly),
  // so overloading it with stamp metadata would change what every existing reader of that key sees.
  draftDispatchedKeyPrefix: 'dungeonmaster-chat-draft-dispatched',
  draftScope: {
    // The composer at /:guildSlug/quest has no questId yet — every browser tab on that route
    // shares this ONE sentinel scope, which can never collide with a real quest id (a UUID never
    // equals this literal). A legacy pre-scoping draft is migrated here too, for the same reason:
    // it carries no recoverable quest identity, and this is the only scope guaranteed not to leak
    // it into an unrelated quest.
    createScopeKey: 'create',
    // Appended to a real questId for the FOLLOW-UP (tavernkeeper) composer in the execution panel
    // — the same quest's spec-phase composer and its follow-up composer are two independent
    // surfaces and must not share one draft. A questId is a UUID and never contains ':', so this
    // suffix can never collide with a bare quest-scoped key.
    followupSuffix: ':followup',
  },
  draftDatabase: {
    name: 'dungeonmaster-chat-drafts',
    version: 1,
    storeName: webConfigStatics.pastedImage.draftImageStoreName,
  },
  // A contenteditable cannot render (or reliably hold) a caret positioned AFTER a trailing newline
  // that has nothing following it — the browser collapses that position back to BEFORE the newline,
  // so a keystroke typed right after an end-of-content Shift+Enter lands before it instead of after.
  // domComposerInsertTextAdapter appends a marked, empty <br> right after a trailing newline to give
  // the browser a renderable position to rest the caret on; domComposerReadAdapter recognises the
  // marker and excludes it from the serialised text, so it never surfaces as an extra '\n'.
  caretFiller: {
    attributeName: 'data-composer-caret-filler',
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
