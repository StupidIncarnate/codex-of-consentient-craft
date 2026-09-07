/**
 * PURPOSE: Chat composer with send/stop buttons. The editor is a `contenteditable` div rather than
 * a `<textarea>` so a pasted image can render as an inline thumbnail at the caret — React never owns
 * its children (that would reset the caret on every paste), so all content lives in the live DOM and
 * is read back out through `domComposerReadAdapter` whenever something needs to know what the
 * composer currently holds. Text drafts persist to localStorage; pasted-image bytes persist to
 * IndexedDB, both across tab close/reopen, and both keyed by composerScopeKeyTransformer's
 * questId+surface scope so one composer's draft can never overwrite or restore into another's. A
 * send also stamps its scope as dispatched before the request leaves the browser, so a reload that
 * outruns the response restores nothing for a message the server may already hold — see
 * chatComposerStatics.draftDispatchedKeyPrefix.
 *
 * USAGE:
 * <ChatInputWidget isStreaming={isStreaming} onSendMessage={handleSend} onStopChat={handleStop} />
 * // Renders a contenteditable composer with send or stop button, restores THIS composer's own
 * // draft text and images on mount — scoped by the URL's questId (or the create-surface sentinel
 * // when absent) and by `surface` ('main' by default; the FOLLOW-UP composer passes 'followup')
 */

import { Box, UnstyledButton } from '@mantine/core';
import { useCallback, useEffect, useRef, useState } from 'react';
import { useParams } from 'react-router-dom';

import type { PastedImageUpload, QuestId, UserInput } from '@dungeonmaster/shared/contracts';
import { pastedImageMediaTypeContract } from '@dungeonmaster/shared/contracts';
import { pastedImageStatics } from '@dungeonmaster/shared/statics';

import { domComposerDeleteThumbnailAdapter } from '../../adapters/dom/composer-delete-thumbnail/dom-composer-delete-thumbnail-adapter';
import { domComposerInsertImageAdapter } from '../../adapters/dom/composer-insert-image/dom-composer-insert-image-adapter';
import { domComposerInsertTextAdapter } from '../../adapters/dom/composer-insert-text/dom-composer-insert-text-adapter';
import { domComposerReadAdapter } from '../../adapters/dom/composer-read/dom-composer-read-adapter';
import { domComposerWriteAdapter } from '../../adapters/dom/composer-write/dom-composer-write-adapter';
import { fileReadDataUrlAdapter } from '../../adapters/file/read-data-url/file-read-data-url-adapter';
import { mantineNotificationsShowAdapter } from '../../adapters/mantine/notifications-show/mantine-notifications-show-adapter';
import { draftImagesLoadBroker } from '../../brokers/draft-images/load/draft-images-load-broker';
import { draftImagesSaveBroker } from '../../brokers/draft-images/save/draft-images-save-broker';
import { pastedImageAttachBroker } from '../../brokers/pasted-image/attach/pasted-image-attach-broker';
import { attachmentIdContract } from '../../contracts/attachment-id/attachment-id-contract';
import type { AttachmentId } from '../../contracts/attachment-id/attachment-id-contract';
import type { ComposerAttachment } from '../../contracts/composer-attachment/composer-attachment-contract';
import type { ComposerScopeKey } from '../../contracts/composer-scope-key/composer-scope-key-contract';
import { composerSendPayloadContract } from '../../contracts/composer-send-payload/composer-send-payload-contract';
import type { ImageDataUrl } from '../../contracts/image-data-url/image-data-url-contract';
import { uploadPercentContract } from '../../contracts/upload-percent/upload-percent-contract';
import type { UploadPercent } from '../../contracts/upload-percent/upload-percent-contract';
import type { UploadProgressHandler } from '../../contracts/upload-progress-post/upload-progress-post-contract';
import { isAllowedPasteMediaTypeGuard } from '../../guards/is-allowed-paste-media-type/is-allowed-paste-media-type-guard';
import { chatComposerStatics } from '../../statics/chat-composer/chat-composer-statics';
import { emberDepthsThemeStatics } from '../../statics/ember-depths-theme/ember-depths-theme-statics';
import { composerParseDraftTransformer } from '../../transformers/composer-parse-draft/composer-parse-draft-transformer';
import { composerScopeKeyTransformer } from '../../transformers/composer-scope-key/composer-scope-key-transformer';
import type { ComposerSurface } from '../../transformers/composer-scope-key/composer-scope-key-transformer';
import { composerSerializeTransformer } from '../../transformers/composer-serialize/composer-serialize-transformer';
import { dataUrlSplitTransformer } from '../../transformers/data-url-split/data-url-split-transformer';
import { pasteMediaTypeNormalizeTransformer } from '../../transformers/paste-media-type-normalize/paste-media-type-normalize-transformer';
import { uploadPercentTransformer } from '../../transformers/upload-percent/upload-percent-transformer';
import { ImageOverlayWidget } from '../image-overlay/image-overlay-widget';
import { UploadProgressBarWidget } from '../upload-progress-bar/upload-progress-bar-widget';

const SEND_BUTTON_SIZE = 44;
const THUMBNAIL_SELECTOR = `img[${chatComposerStatics.thumbnail.attributeName}]`;

export interface ChatInputWidgetProps {
  isStreaming: boolean;
  onSendMessage: (params: {
    message: UserInput;
    images?: readonly PastedImageUpload[];
    onProgress?: UploadProgressHandler;
  }) => Promise<void>;
  onStopChat: () => void;
  // Which composer this instance is — the quest's main (spec-phase) composer, sharing this
  // widget's draft with the create surface once a quest exists, or the FOLLOW-UP (tavernkeeper)
  // composer in the execution panel, which must never share a draft with the main one even though
  // both mount on the SAME quest at the SAME URL. Defaults to 'main': every call site except
  // ExecutionPanelWidget's follow-up tab wants the default. See composerScopeKeyTransformer.
  surface?: ComposerSurface;
}

export const ChatInputWidget = ({
  isStreaming,
  onSendMessage,
  onStopChat,
  surface = 'main',
}: ChatInputWidgetProps): React.JSX.Element => {
  const { colors } = emberDepthsThemeStatics;
  // Read directly from the URL rather than threaded down as a prop — every composer mount already
  // sits under /:guildSlug/quest or /:guildSlug/quest/:questId, so this is the SAME questId
  // QuestChatContentLayerWidget derives from its own useParams() call three layers up, without
  // adding a questId prop to ChatPanelWidget/ChatInputWidget that every existing call site (and
  // every existing test) would have to start threading through. See composerScopeKeyTransformer's
  // header for why this, `surface`, and the create-surface sentinel together decide the draft.
  const params = useParams();
  const questId = (params.questId as QuestId | undefined) ?? null;
  const composerScope = composerScopeKeyTransformer({ questId, surface });
  const editorRef = useRef<HTMLDivElement | null>(null);
  // The bytes for every attachment currently in the composer. A ref rather than state — nothing
  // rendered by React ever depends on its contents (thumbnails live in the raw DOM, not JSX), so
  // there is no reason to route every paste/delete through a re-render. A ref also sidesteps the
  // stale-closure trap state would reintroduce here: a paste that called setState and then
  // immediately needed the "current" map for the content-changed step would still see the
  // pre-update value, since React state updates are not synchronous.
  const attachmentsRef = useRef<Map<AttachmentId, ComposerAttachment>>(new Map());
  // The attachment id list as of the last IndexedDB write. `handleContentChanged` now runs on every
  // keystroke (wired to the editor's native `input` event, below) as well as on paste/delete, so the
  // IndexedDB write itself is gated on whether this list actually changed since the last write — a
  // paste, a delete, or a reorder changes which attachments are attached and pays for the write; a
  // keystroke does not touch that list and must not pay for one. Five images at the per-image byte
  // ceiling is roughly 25 MB of IndexedDB records, which is what an unconditional write on every
  // character typed would rewrite.
  const lastSavedAttachmentIdsRef = useRef<readonly AttachmentId[]>([]);
  // Counts content-changed steps, so the retraction a failed IndexedDB write schedules can tell
  // whether the composer still holds the content that write was for. The text a retraction restores
  // is a SNAPSHOT taken before the round trip; a keystroke landing during that round trip persists
  // newer text synchronously, and letting a stale retraction land afterwards would replace that
  // newer draft with older content. Whatever superseded it owns the draft from then on, so a
  // superseded retraction is dropped rather than re-derived.
  const contentRevisionRef = useRef(0);
  const cancelledRestoreRef = useRef(false);
  // The scope whose draft this instance is currently showing. One ChatInputWidget instance outlives
  // a change of scope — the create surface's composer is still mounted when the route gains a
  // questId, and the follow-up tab re-points the same composer at a different surface — so
  // restoreDraft compares this against the scope it is about to restore and empties the editor when
  // they differ. `null` means nothing has been restored yet (a genuinely fresh mount), which must
  // NOT clear: the editor is already empty and a user who typed into it before the first restore
  // settled would lose that. See restoreDraft.
  const restoredScopeRef = useRef<ComposerScopeKey | null>(null);
  // Mirrors `isSending` for a synchronous read. React state updates are not visible to a second
  // synchronous call in the SAME tick — two clicks fired back-to-back with no await between them
  // both close over the render that was current when the burst started, so a state-only guard lets
  // both through. `handleSend`'s re-entrancy guard reads this ref instead. `isSending` itself keeps
  // driving SEND_BUTTON's `disabled` and the STOP/SEND swap — both are render concerns this ref does
  // not replace.
  const isSendingRef = useRef(false);
  const [overlaySrc, setOverlaySrc] = useState<ImageDataUrl | null>(null);
  const [isEmpty, setIsEmpty] = useState(true);
  // Settled-transaction state: locks the composer for the ONE POST an Enter/click issues, and
  // paints the byte-tracked bar while that POST is in flight. Neither survives past `.finally` —
  // see handleSend.
  const [isSending, setIsSending] = useState(false);
  const [uploadPercent, setUploadPercent] = useState<UploadPercent | null>(null);

  // Stamps/clears the "this draft's send already left the browser" marker — see
  // chatComposerStatics.draftDispatchedKeyPrefix's own header for the full mechanics. Two tiny
  // standalone callbacks (not folded into handleSend) so restoreDraft below can reach the SAME
  // clear semantics without duplicating the key-building.
  const markDraftDispatched = useCallback((): void => {
    const dispatchedKey = `${chatComposerStatics.draftDispatchedKeyPrefix}:${composerScope}`;
    try {
      localStorage.setItem(dispatchedKey, 'true');
    } catch {
      // localStorage unavailable
    }
  }, [composerScope]);

  const clearDraftDispatchedStamp = useCallback((): void => {
    const dispatchedKey = `${chatComposerStatics.draftDispatchedKeyPrefix}:${composerScope}`;
    try {
      localStorage.removeItem(dispatchedKey);
    } catch {
      // localStorage unavailable
    }
  }, [composerScope]);

  // Writes the localStorage half of the draft only. A standalone callback (not inlined into
  // handleContentChanged below) because that callback writes through it twice per attachment
  // change — once for the content it just persisted, and once more to retract that content if the
  // IndexedDB write behind it fails.
  const writeTextDraft = useCallback(
    ({ text }: { text: string }): void => {
      const scopedKey = `${chatComposerStatics.draftStorageKeyPrefix}:${composerScope}`;
      try {
        if (text.length > 0) {
          localStorage.setItem(scopedKey, text);
        } else {
          localStorage.removeItem(scopedKey);
        }
      } catch {
        // localStorage unavailable
      }
    },
    [composerScope],
  );

  // Reads the live DOM, persists the text half to localStorage and the image half to IndexedDB
  // (only when the attachment id list changed — see the ref above). Wired below to the editor's
  // native `input` event, which is what makes plain typing reach here: `input` fires after ANY
  // mutation the browser makes to the element — native typing, IME composition, autocorrect,
  // Playwright's `.fill()` — and is exactly the set the `beforeinput` intercepts in
  // handleBeforeInput deliberately do NOT cover (insertText is only intercepted while a thumbnail
  // is present; delete is only intercepted while the caret touches one). Also called directly from
  // the paste path, since a pasted image or pasted text is inserted programmatically there and so
  // never fires a native `input` event on its own. Never call this only on send, or a tab closed
  // mid-draft loses everything since the last send.
  const handleContentChanged = useCallback(
    ({ force }: { force: boolean }): void => {
      const editor = editorRef.current;
      if (editor === null) return;

      const segments = domComposerReadAdapter({ editor });
      const { text, attachmentIds } = composerSerializeTransformer({ segments });

      setIsEmpty(text.length === 0);

      const revision = contentRevisionRef.current + 1;
      contentRevisionRef.current = revision;

      const previousAttachmentIds = lastSavedAttachmentIdsRef.current;
      const attachmentIdsUnchanged =
        attachmentIds.length === previousAttachmentIds.length &&
        attachmentIds.every((attachmentId, index) => attachmentId === previousAttachmentIds[index]);

      if (attachmentIdsUnchanged && !force) {
        // No attachment-list change means no IndexedDB write at all, so there is nothing this step
        // could ever have to retract — a plain keystroke persists its text and is done.
        writeTextDraft({ text });
        return;
      }

      // Only an attachment this step ADDS can leave a placeholder token in localStorage naming bytes
      // IndexedDB never accepted, so only an addition arms the retraction below. A removal is the
      // mirror image and needs none: its text names FEWER images than the store holds, which the
      // next save overwrites and which a restore reads as an orphaned record nothing points at.
      const previouslySavedIds = new Set(previousAttachmentIds);
      const addsAttachment = attachmentIds.some(
        (attachmentId) => !previouslySavedIds.has(attachmentId),
      );

      // Recorded before the write starts (not after it resolves) so a second content-changed step
      // for the same gesture would still see the new list as already "saved". In practice none of
      // the intercepted paths produce a second step: handlePaste and the handleBeforeInput
      // intercepts both call `event.preventDefault()` before mutating the DOM programmatically,
      // which is neither a native edit that fires `input` nor something a DOM API call fires on
      // its own — see the "typing around a thumbnail" and "the caret after a delete" describe
      // blocks below, none of which needed a second `handleContentChanged` call to pass.
      lastSavedAttachmentIdsRef.current = attachmentIds;

      const orderedAttachments = attachmentIds
        .map((attachmentId) => attachmentsRef.current.get(attachmentId))
        .filter((attachment): attachment is ComposerAttachment => attachment !== undefined);

      // The draft that is durable RIGHT NOW — every token in it names bytes IndexedDB already
      // accepted. Read before the write below overwrites it, because it is what the retraction
      // restores; re-deriving it from the live DOM afterwards would rebuild the very content whose
      // bytes failed.
      const durableText = (() => {
        const scopedKey = `${chatComposerStatics.draftStorageKeyPrefix}:${composerScope}`;
        try {
          return localStorage.getItem(scopedKey) ?? '';
        } catch {
          return '';
        }
      })();

      // The text draft is written in the SAME synchronous step that put the thumbnail on screen, so
      // the persisted draft never names fewer images than the composer is showing. Holding it back
      // for the IndexedDB round trip is what opens that gap, and a reload landing in it restores a
      // composer one image short of what the user was looking at — with the bytes for that image
      // sitting in the store, orphaned, because no token addresses them.
      writeTextDraft({ text });

      // Durability is held by RETRACTING the token instead of delaying it: a draft that SURVIVES
      // never names bytes IndexedDB does not hold. A reload that outruns the retraction leaves the
      // token behind, and composerParseDraftTransformer drops a token whose record is missing — so
      // the worst case degrades to the surrounding text, never to a literal "[Pasted Image N]" the
      // user could send as prose. The revision check is what keeps a retraction from costing content
      // typed while the write was in flight — see contentRevisionRef.
      draftImagesSaveBroker({ scopeKey: composerScope, attachments: orderedAttachments }).catch(
        (error: unknown) => {
          globalThis.console.error('[chat-input] failed to save draft images', error);
          if (addsAttachment && contentRevisionRef.current === revision) {
            writeTextDraft({ text: durableText });
          }
        },
      );
    },
    [writeTextDraft, composerScope],
  );

  const handlePaste = useCallback(
    async (event: React.ClipboardEvent<HTMLDivElement>): Promise<void> => {
      const editor = editorRef.current;
      if (editor === null) return;

      // A clipboard-declared type is attacker/OS-controlled and can vary from its canonical form
      // only by case or surrounding whitespace ('IMAGE/PNG'), or carry no information at all (an
      // empty or whitespace-only type). Both this selection test and the allow-list check below
      // read the SAME normalised value, via pasteMediaTypeNormalizeTransformer, so a file item
      // one side would recognise as image-ish is never silently handed to the plain-text branch by
      // the other. An item whose normalised type is neither empty nor image-prefixed (a PDF, a
      // text/plain item, no file item at all) is genuinely not an attempted image paste and still
      // takes the plain-text branch below, unchanged.
      const items = Array.from(event.clipboardData.items);
      const imageItem = items.find((item) => {
        if (item.kind !== 'file') return false;
        const normalizedType = pasteMediaTypeNormalizeTransformer({ mediaType: item.type });
        return normalizedType === '' || normalizedType.startsWith('image/');
      });

      if (imageItem === undefined) {
        event.preventDefault();
        domComposerInsertTextAdapter({ editor, text: event.clipboardData.getData('text/plain') });
        handleContentChanged({ force: false });
        return;
      }

      // Prevented synchronously, before any async work — a paste this widget decides to handle
      // must never also let the browser insert its own (unmanaged) copy of the image or text.
      event.preventDefault();

      const normalizedMediaType = pasteMediaTypeNormalizeTransformer({ mediaType: imageItem.type });

      if (!isAllowedPasteMediaTypeGuard({ mediaType: normalizedMediaType })) {
        mantineNotificationsShowAdapter({
          message: chatComposerStatics.toasts.unsupportedFormat,
          color: chatComposerStatics.toastColor,
        });
        return;
      }

      // Counted from the DOM, not attachmentsRef — the ref is this widget's own bookkeeping and
      // could in principle drift from what is actually rendered; the limit is a promise about what
      // the user SEES, so it is enforced against the same thing the user sees.
      const existingThumbnailCount = editor.querySelectorAll(THUMBNAIL_SELECTOR).length;

      if (existingThumbnailCount >= pastedImageStatics.maxImagesPerMessage) {
        mantineNotificationsShowAdapter({
          message: chatComposerStatics.toasts.tooManyImages,
          color: chatComposerStatics.toastColor,
        });
        return;
      }

      const file = imageItem.getAsFile();
      if (file === null) return;

      try {
        // FileReader embeds a Blob's own `type` verbatim into the data URL it produces — lowercased,
        // but never TRIMMED, so a clipboard-declared 'image/png ' (trailing space) round-trips as
        // literally 'image/png ' — and imageDataUrlContract has zero whitespace tolerance for that
        // segment. Reading `file` as-is would carry that untrimmed type straight into the data URL and
        // throw on a perfectly valid image. Retyping the Blob to the ALREADY-normalised value before
        // the read is what makes the data URL below carry that same normalised type — the one value
        // computed once above and threaded through the allow-list check, this read, and the
        // `mediaType` passed to pastedImageAttachBroker.
        const dataUrl = await fileReadDataUrlAdapter({
          blob: new Blob([file], { type: normalizedMediaType }),
        });
        const attachment = await pastedImageAttachBroker({
          dataUrl,
          mediaType: pastedImageMediaTypeContract.parse(normalizedMediaType),
        });

        // Re-read the live count here, immediately before the insert it gates — the read above ran
        // before this function's first `await`, so a second paste committed by another in-flight
        // handlePaste call in the meantime is invisible to it. Nothing awaits between this read and
        // the insert below, so nothing else can commit in between: this is the point where the count
        // is actually current. A paste that loses this second check gets the identical toast a
        // sequential sixth paste gets, rather than being silently dropped.
        const committedThumbnailCount = editor.querySelectorAll(THUMBNAIL_SELECTOR).length;
        if (committedThumbnailCount >= pastedImageStatics.maxImagesPerMessage) {
          mantineNotificationsShowAdapter({
            message: chatComposerStatics.toasts.tooManyImages,
            color: chatComposerStatics.toastColor,
          });
          return;
        }

        domComposerInsertImageAdapter({ editor, attachment });
        attachmentsRef.current.set(attachment.attachmentId, attachment);
        handleContentChanged({ force: false });
      } catch {
        // A ladder that bottoms out and an image that will not decode both land here — the user
        // sees one message either way, because neither failure is something they can act on
        // differently.
        mantineNotificationsShowAdapter({
          message: chatComposerStatics.toasts.cannotReduce,
          color: chatComposerStatics.toastColor,
        });
      }
    },
    [handleContentChanged],
  );

  // A settled transaction: locked at the first line so one Enter is one POST, cleared ONLY on
  // acceptance (the composer must survive a rejection with its text and thumbnails intact), and
  // torn down in `.finally` regardless of outcome so the bar never reads as still in flight.
  const handleSend = useCallback((): void => {
    const editor = editorRef.current;
    if (editor === null) return;
    // Reads the ref, not the `isSending` state — see the ref's own declaration above for why a
    // second call in the same synchronous burst needs a synchronous read here.
    if (isSendingRef.current) return;

    const segments = domComposerReadAdapter({ editor });
    const { text, attachmentIds } = composerSerializeTransformer({ segments });
    const trimmed = text.trim();
    if (trimmed.length === 0) return;

    const orderedAttachments = attachmentIds
      .map((attachmentId) => attachmentsRef.current.get(attachmentId))
      .filter((attachment): attachment is ComposerAttachment => attachment !== undefined);

    const payload = composerSendPayloadContract.parse({
      message: trimmed,
      attachments: orderedAttachments,
    });
    const images = payload.attachments.map((attachment) =>
      dataUrlSplitTransformer({ dataUrl: attachment.dataUrl }),
    );

    // A snapshot of exactly what THIS send is submitting — the live DOM nodes it read above, and
    // the attachment ids that made it into the payload. The success handler below removes only
    // these, rather than wiping whatever the editor holds once the response comes back: content
    // that arrives after this point (a paste that lands while the request is in flight) is never a
    // member of either snapshot, so it survives untouched.
    const sentNodes = Array.from(editor.childNodes);
    const sentAttachmentIds = payload.attachments.map((attachment) => attachment.attachmentId);

    // Set synchronously, before any await, alongside `setIsSending` — a second call arriving in the
    // same tick (no await between two clicks/keydowns) must see this flip immediately, which the
    // state setter above cannot guarantee.
    isSendingRef.current = true;
    setIsSending(true);
    // Stamped HERE — before onSendMessage, before any await — so the stamp is durably in
    // localStorage the instant this send leaves the browser. A page reload racing the response
    // (the response can arrive at the server and be accepted while the reload wins the race to
    // this document's own JS) still finds the stamp on the next mount; see restoreDraft. Cleared
    // in `.then`/`.catch` below the moment THIS document learns the outcome either way.
    markDraftDispatched();
    if (images.length > 0) {
      setUploadPercent(uploadPercentContract.parse(chatComposerStatics.upload.minPercent));
    }

    onSendMessage({
      message: payload.message,
      ...(images.length > 0
        ? {
            images,
            onProgress: ({ bytesSent, bytesTotal }: Parameters<UploadProgressHandler>[0]) => {
              setUploadPercent(uploadPercentTransformer({ bytesSent, bytesTotal }));
            },
          }
        : {}),
    })
      .then(() => {
        for (const node of sentNodes) {
          if (node.parentNode === editor) {
            editor.removeChild(node);
          }
        }
        for (const attachmentId of sentAttachmentIds) {
          attachmentsRef.current.delete(attachmentId);
        }
        // Re-derives text/emptiness/localStorage/IndexedDB from the LIVE DOM and the now-trimmed
        // attachment map — `force: true` because the removal above can leave the attachment id list
        // exactly where it was already saved (nothing survived) or genuinely changed (something
        // did), and either way this is the read that has to run.
        handleContentChanged({ force: true });
        // This document saw the acceptance — the stamp has done its job for this send.
        clearDraftDispatchedStamp();
      })
      .catch((error: unknown) => {
        mantineNotificationsShowAdapter({
          message: error instanceof Error ? error.message : String(error),
          color: chatComposerStatics.toastColor,
        });
        // `force: true` because a draft may never have been written for this content (the
        // attachment id list can be unchanged since the last save) — the composer's recoverability
        // must not depend on a write that already happened to have occurred.
        handleContentChanged({ force: true });
        // This document saw the rejection — clear the stamp so a future restore offers this
        // (still-intact) draft back normally, rather than treating it as already delivered.
        clearDraftDispatchedStamp();
      })
      .finally(() => {
        isSendingRef.current = false;
        setIsSending(false);
        setUploadPercent(null);
      });
  }, [onSendMessage, handleContentChanged, markDraftDispatched, clearDraftDispatchedStamp]);

  const handleKeyDown = useCallback(
    (event: React.KeyboardEvent<HTMLDivElement>): void => {
      const editor = editorRef.current;
      if (editor === null) return;

      // A contenteditable's own default for Enter is to insert a block element, not a newline —
      // wrong in a real browser and unobservable in jsdom. Handled explicitly so Shift+Enter
      // inserts exactly one '\n', deliberately, rather than inheriting whatever the browser does.
      if (event.key === 'Enter' && event.shiftKey) {
        event.preventDefault();
        domComposerInsertTextAdapter({ editor, text: '\n' });
        handleContentChanged({ force: false });
        return;
      }

      if (event.key === 'Enter' && !event.shiftKey) {
        event.preventDefault();
        handleSend();
      }
    },
    [handleSend, handleContentChanged],
  );

  const handleEditorClick = useCallback((event: React.MouseEvent<HTMLDivElement>): void => {
    const { target } = event;
    if (!(target instanceof HTMLImageElement)) return;

    const rawAttachmentId = target.getAttribute(chatComposerStatics.thumbnail.attributeName);
    if (rawAttachmentId === null) return;

    const attachment = attachmentsRef.current.get(attachmentIdContract.parse(rawAttachmentId));
    if (attachment === undefined) return;

    setOverlaySrc(attachment.dataUrl);
  }, []);

  // Native listener, not React's onBeforeInput — the synthetic version does not carry `inputType`,
  // which is the only signal that tells a plain keystroke apart from a delete that needs to reach
  // through an atomic thumbnail.
  const handleBeforeInput = useCallback(
    (event: InputEvent): void => {
      const editor = editorRef.current;
      if (editor === null) return;

      if (
        event.inputType === 'deleteContentBackward' ||
        event.inputType === 'deleteContentForward'
      ) {
        const removedAttachmentId = domComposerDeleteThumbnailAdapter({
          editor,
          direction: event.inputType === 'deleteContentBackward' ? 'backward' : 'forward',
        });

        if (removedAttachmentId !== undefined) {
          event.preventDefault();
          attachmentsRef.current.delete(removedAttachmentId);
          handleContentChanged({ force: false });
        }
        // undefined means the caret was not touching a thumbnail — let the browser handle it.
        return;
      }

      if (event.inputType === 'insertText') {
        // Only intercepted while the composer holds a thumbnail. 18 Playwright e2e specs fill
        // CHAT_INPUT with plain text — `.fill()` runs as a select-all delete followed by a single
        // native insertText — and every one of those runs against a composer with no image in it.
        // Intercepting insertText unconditionally would hijack all 18; this is what keeps them on
        // the browser's own (correct) native text-insertion path.
        const hasThumbnail = editor.querySelector(THUMBNAIL_SELECTOR) !== null;
        if (hasThumbnail) {
          event.preventDefault();
          domComposerInsertTextAdapter({ editor, text: event.data ?? '' });
          handleContentChanged({ force: false });
        }
      }
    },
    [handleContentChanged],
  );

  useEffect(() => {
    const editor = editorRef.current;
    if (editor === null) return undefined;

    editor.addEventListener('beforeinput', handleBeforeInput);
    return () => {
      editor.removeEventListener('beforeinput', handleBeforeInput);
    };
  }, [handleBeforeInput]);

  // Restores a draft left behind by a previous tab, SCOPED to this composer alone — see
  // composerScopeKeyTransformer's header. Deliberately a no-op when there is nothing to restore
  // (both halves empty) — writing an empty segment list would call `replaceChildren()` on
  // whatever the user has ALREADY typed or pasted while this async restore was still in flight.
  const restoreDraft = useCallback(async (): Promise<void> => {
    // A scope change empties the editor SYNCHRONOUSLY, before the text read and before the first
    // `await`. Everything below this point is allowed to leave the editor alone when the NEW scope
    // has nothing to restore — that early return is what stops an in-flight restore from
    // `replaceChildren()`-ing over content the user typed while it was running — so without this
    // clear the previous scope's text and thumbnails simply stay on screen, now belonging to the new
    // scope: one keystroke then writes them into that scope's draft. Placed above the `await` so
    // there is no window in which a keystroke can do that.
    if (restoredScopeRef.current !== null && restoredScopeRef.current !== composerScope) {
      const previousEditor = editorRef.current;
      attachmentsRef.current = new Map();
      lastSavedAttachmentIdsRef.current = [];
      if (previousEditor !== null) {
        domComposerWriteAdapter({ editor: previousEditor, segments: [], attachments: new Map() });
      }
      setIsEmpty(true);
    }
    restoredScopeRef.current = composerScope;

    const wasDispatched = (() => {
      try {
        const dispatchedKey = `${chatComposerStatics.draftDispatchedKeyPrefix}:${composerScope}`;
        return localStorage.getItem(dispatchedKey) !== null;
      } catch {
        return false;
      }
    })();

    if (wasDispatched) {
      // This composer's own document never learned whether its last send was accepted or
      // rejected — the stamp survived to this mount, which happens when a page reload (or tab
      // close) outran the response. Treat it as delivered: clear the stamp and whatever the draft
      // still holds, and leave the composer exactly as empty as a mount with no draft at all,
      // rather than re-offering content the transcript may already show as sent (the duplicate-
      // send bug this exists to prevent). `handleContentChanged({force: true})` against the still-
      // empty, freshly-mounted editor is what performs that clear — the SAME codepath handleSend's
      // own `.then` uses for an acceptance THIS document did see; see that comment for why `force`
      // is required.
      clearDraftDispatchedStamp();
      handleContentChanged({ force: true });
      return;
    }

    const scopedKey = `${chatComposerStatics.draftStorageKeyPrefix}:${composerScope}`;
    const text = (() => {
      try {
        const scopedValue = localStorage.getItem(scopedKey);
        if (scopedValue !== null) return scopedValue;
        if (composerScope !== chatComposerStatics.draftScope.createScopeKey) return '';
        // MIGRATION: a draft saved before per-composer scoping existed lived under one global
        // key, shared by every quest and every tab. That old key carries no quest identity to
        // recover, so the ONLY scope it can safely join is the create surface's — the one scope
        // no real quest can ever collide with (see chatComposerStatics.draftScope.createScopeKey).
        // Adopted once: written to the scoped key and the legacy key removed, so this branch is a
        // no-op on every restore after the first.
        const legacyValue = localStorage.getItem(chatComposerStatics.draftStorageKeyPrefix);
        if (legacyValue === null) return '';
        localStorage.setItem(scopedKey, legacyValue);
        localStorage.removeItem(chatComposerStatics.draftStorageKeyPrefix);
        return legacyValue;
      } catch {
        return '';
      }
    })();

    try {
      const loadedAttachments = await draftImagesLoadBroker({ scopeKey: composerScope });
      if (cancelledRestoreRef.current) return;
      if (text.length === 0 && loadedAttachments.length === 0) return;

      // A hole (a record whose bytes failed to load) stays at its OWN index here — see
      // draftImagesLoadBroker's header — so the Nth placeholder still gets the Nth id, and
      // composerParseDraftTransformer drops only the one token whose id is undefined, exactly as
      // it already drops a token that never had a backing record at all.
      const attachmentIds = loadedAttachments.map((attachment) => attachment?.attachmentId);
      const segments = composerParseDraftTransformer({ text, attachmentIds });
      const resolvedAttachments = loadedAttachments.filter(
        (attachment): attachment is ComposerAttachment => attachment !== undefined,
      );
      const map = new Map(
        resolvedAttachments.map((attachment) => [attachment.attachmentId, attachment] as const),
      );
      attachmentsRef.current = map;
      // These ids are what IndexedDB already holds — they were just read back out of it — so the
      // first keystroke after a restore must not immediately rewrite the store it was just loaded
      // from. Holes are excluded here: IndexedDB never held a record for one, so there is nothing
      // for a later handleContentChanged comparison to treat as "already saved".
      lastSavedAttachmentIdsRef.current = resolvedAttachments.map(
        (attachment) => attachment.attachmentId,
      );
      // Derived from the PARSED segments, not the raw localStorage text length — a draft made of
      // nothing but an orphaned "[Pasted Image N]" token (no backing record) parses to zero
      // segments even though its raw text is non-empty, and the placeholder hint must show for
      // that composer exactly as it would for one that was never typed into.
      setIsEmpty(segments.length === 0);

      const editor = editorRef.current;
      if (editor !== null) {
        domComposerWriteAdapter({ editor, segments, attachments: map });
      }
    } catch (error) {
      globalThis.console.error('[chat-input] failed to restore draft', error);
    }
  }, [composerScope, handleContentChanged, clearDraftDispatchedStamp]);

  useEffect(() => {
    cancelledRestoreRef.current = false;
    restoreDraft().catch((error: unknown) => {
      globalThis.console.error('[chat-input] failed to restore draft', error);
    });
    return () => {
      cancelledRestoreRef.current = true;
    };
  }, [restoreDraft]);

  return (
    <Box style={{ padding: 12 }}>
      <div style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
        <div style={{ flex: 1, position: 'relative' }}>
          <div
            data-testid="CHAT_INPUT"
            ref={editorRef}
            // Gated on `isSending` alone — the settled-transaction flag for THIS composer's own
            // POST — never on `isStreaming`. `isStreaming` answers "is the agent's turn still
            // running", which the STOP/SEND swap below tracks correctly, but which can stay true
            // for a whole model turn after the POST that started it has already resolved. Coupling
            // editability to it locks the composer for the length of that turn instead of the
            // length of the request — see design decision #http-response-and-agent-spawn-fork: the
            // response and the spawn are two separate outgoing edges, and only the first one gates
            // this.
            contentEditable={!isSending}
            suppressContentEditableWarning
            onPaste={(event) => {
              handlePaste(event).catch((error: unknown) => {
                globalThis.console.error('[chat-input] paste handler failed', error);
              });
            }}
            onInput={() => {
              handleContentChanged({ force: false });
            }}
            onKeyDown={handleKeyDown}
            onClick={handleEditorClick}
            style={{
              fontFamily: 'monospace',
              fontSize: 12,
              color: colors.text,
              backgroundColor: colors['bg-deep'],
              border: `1px solid ${colors.border}`,
              borderRadius: 2,
              padding: 8,
              minHeight: 60,
              maxHeight: 200,
              overflowY: 'auto',
              lineHeight: 1.4,
              outline: 'none',
              whiteSpace: 'pre-wrap',
              wordBreak: 'break-word',
            }}
          />
          {isEmpty ? (
            <div
              data-testid="CHAT_INPUT_PLACEHOLDER"
              style={{
                position: 'absolute',
                top: 8,
                left: 8,
                color: colors['text-dim'],
                fontFamily: 'monospace',
                fontSize: 12,
                pointerEvents: 'none',
              }}
            >
              Describe your quest...
            </div>
          ) : null}
          {uploadPercent === null ? null : <UploadProgressBarWidget percent={uploadPercent} />}
        </div>
        {isStreaming ? (
          <UnstyledButton
            data-testid="STOP_BUTTON"
            onClick={() => {
              onStopChat();
            }}
            style={{
              width: SEND_BUTTON_SIZE,
              height: SEND_BUTTON_SIZE,
              flexShrink: 0,
              backgroundColor: colors.danger,
              border: `1px solid ${colors.border}`,
              borderRadius: 2,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: colors.text,
              fontFamily: 'monospace',
              fontSize: 16,
            }}
          >
            {'■'}
          </UnstyledButton>
        ) : (
          <UnstyledButton
            data-testid="SEND_BUTTON"
            onClick={handleSend}
            disabled={isSending}
            style={{
              width: SEND_BUTTON_SIZE,
              height: SEND_BUTTON_SIZE,
              flexShrink: 0,
              backgroundColor: colors.primary,
              border: `1px solid ${colors.border}`,
              borderRadius: 2,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: colors['bg-deep'],
              fontFamily: 'monospace',
              fontSize: 18,
            }}
          >
            {'▶'}
          </UnstyledButton>
        )}
      </div>
      <ImageOverlayWidget
        opened={overlaySrc !== null}
        src={overlaySrc ?? ''}
        alt="Pasted image"
        onClose={() => {
          setOverlaySrc(null);
        }}
      />
    </Box>
  );
};
