/**
 * PURPOSE: Chat composer with send/stop buttons. The editor is a `contenteditable` div rather than
 * a `<textarea>` so a pasted image can render as an inline thumbnail at the caret — React never owns
 * its children (that would reset the caret on every paste), so all content lives in the live DOM and
 * is read back out through `domComposerReadAdapter` whenever something needs to know what the
 * composer currently holds. Text drafts persist to localStorage; pasted-image bytes persist to
 * IndexedDB, both across tab close/reopen.
 *
 * USAGE:
 * <ChatInputWidget isStreaming={isStreaming} onSendMessage={handleSend} onStopChat={handleStop} />
 * // Renders a contenteditable composer with send or stop button, restores draft text and images on mount
 */

import { Box, UnstyledButton } from '@mantine/core';
import { useCallback, useEffect, useRef, useState } from 'react';

import type { PastedImageUpload, UserInput } from '@dungeonmaster/shared/contracts';
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
import { composerSendPayloadContract } from '../../contracts/composer-send-payload/composer-send-payload-contract';
import type { ImageDataUrl } from '../../contracts/image-data-url/image-data-url-contract';
import { uploadPercentContract } from '../../contracts/upload-percent/upload-percent-contract';
import type { UploadPercent } from '../../contracts/upload-percent/upload-percent-contract';
import type { UploadProgressHandler } from '../../contracts/upload-progress-post/upload-progress-post-contract';
import { isAllowedPasteMediaTypeGuard } from '../../guards/is-allowed-paste-media-type/is-allowed-paste-media-type-guard';
import { chatComposerStatics } from '../../statics/chat-composer/chat-composer-statics';
import { emberDepthsThemeStatics } from '../../statics/ember-depths-theme/ember-depths-theme-statics';
import { composerParseDraftTransformer } from '../../transformers/composer-parse-draft/composer-parse-draft-transformer';
import { composerSerializeTransformer } from '../../transformers/composer-serialize/composer-serialize-transformer';
import { dataUrlSplitTransformer } from '../../transformers/data-url-split/data-url-split-transformer';
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
}

export const ChatInputWidget = ({
  isStreaming,
  onSendMessage,
  onStopChat,
}: ChatInputWidgetProps): React.JSX.Element => {
  const { colors } = emberDepthsThemeStatics;
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
  const cancelledRestoreRef = useRef(false);
  const [overlaySrc, setOverlaySrc] = useState<ImageDataUrl | null>(null);
  const [isEmpty, setIsEmpty] = useState(true);
  // Settled-transaction state: locks the composer for the ONE POST an Enter/click issues, and
  // paints the byte-tracked bar while that POST is in flight. Neither survives past `.finally` —
  // see handleSend.
  const [isSending, setIsSending] = useState(false);
  const [uploadPercent, setUploadPercent] = useState<UploadPercent | null>(null);

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
  const handleContentChanged = useCallback(({ force }: { force: boolean }): void => {
    const editor = editorRef.current;
    if (editor === null) return;

    const segments = domComposerReadAdapter({ editor });
    const { text, attachmentIds } = composerSerializeTransformer({ segments });

    setIsEmpty(text.length === 0);

    try {
      if (text.length > 0) {
        localStorage.setItem(chatComposerStatics.draftStorageKey, text);
      } else {
        localStorage.removeItem(chatComposerStatics.draftStorageKey);
      }
    } catch {
      // localStorage unavailable
    }

    const previousAttachmentIds = lastSavedAttachmentIdsRef.current;
    const attachmentIdsUnchanged =
      attachmentIds.length === previousAttachmentIds.length &&
      attachmentIds.every((attachmentId, index) => attachmentId === previousAttachmentIds[index]);

    if (attachmentIdsUnchanged && !force) return;
    // Recorded before the write starts (not after it resolves) so a second content-changed step
    // for the same gesture would still see the new list as already "saved". In practice none of the
    // intercepted paths produce a second step: handlePaste and the handleBeforeInput intercepts
    // both call `event.preventDefault()` before mutating the DOM programmatically, which is neither
    // a native edit that fires `input` nor something a DOM API call fires on its own — see the
    // "typing around a thumbnail" and "the caret after a delete" describe blocks below, none of
    // which needed a second `handleContentChanged` call to pass.
    lastSavedAttachmentIdsRef.current = attachmentIds;

    const orderedAttachments = attachmentIds
      .map((attachmentId) => attachmentsRef.current.get(attachmentId))
      .filter((attachment): attachment is ComposerAttachment => attachment !== undefined);

    draftImagesSaveBroker({ attachments: orderedAttachments }).catch((error: unknown) => {
      globalThis.console.error('[chat-input] failed to save draft images', error);
    });
  }, []);

  const handlePaste = useCallback(
    async (event: React.ClipboardEvent<HTMLDivElement>): Promise<void> => {
      const editor = editorRef.current;
      if (editor === null) return;

      const items = Array.from(event.clipboardData.items);
      const imageItem = items.find(
        (item) => item.kind === 'file' && item.type.startsWith('image/'),
      );

      if (imageItem === undefined) {
        event.preventDefault();
        domComposerInsertTextAdapter({ editor, text: event.clipboardData.getData('text/plain') });
        handleContentChanged({ force: false });
        return;
      }

      // Prevented synchronously, before any async work — a paste this widget decides to handle
      // must never also let the browser insert its own (unmanaged) copy of the image or text.
      event.preventDefault();

      if (!isAllowedPasteMediaTypeGuard({ mediaType: imageItem.type })) {
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
        const dataUrl = await fileReadDataUrlAdapter({ blob: file });
        const attachment = await pastedImageAttachBroker({
          dataUrl,
          mediaType: pastedImageMediaTypeContract.parse(imageItem.type),
        });
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
    if (isSending) return;

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

    setIsSending(true);
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
        editor.replaceChildren();
        attachmentsRef.current = new Map();
        lastSavedAttachmentIdsRef.current = [];
        setIsEmpty(true);
        try {
          localStorage.removeItem(chatComposerStatics.draftStorageKey);
        } catch {
          // localStorage unavailable
        }
        // Deliberately NOT returned into the chain — a failed draft-clear must never fall into
        // the rejection handler below and toast an error for a send that actually succeeded.
        draftImagesSaveBroker({ attachments: [] }).catch((error: unknown) => {
          globalThis.console.error('[chat-input] failed to clear draft images', error);
        });
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
      })
      .finally(() => {
        setIsSending(false);
        setUploadPercent(null);
      });
  }, [isSending, onSendMessage, handleContentChanged]);

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

  // Restores a draft left behind by a previous tab. Deliberately a no-op when there is nothing to
  // restore (both halves empty) — writing an empty segment list would call `replaceChildren()` on
  // whatever the user has ALREADY typed or pasted while this async restore was still in flight.
  const restoreDraft = useCallback(async (): Promise<void> => {
    const text = (() => {
      try {
        return localStorage.getItem(chatComposerStatics.draftStorageKey) ?? '';
      } catch {
        return '';
      }
    })();

    try {
      const loadedAttachments = await draftImagesLoadBroker();
      if (cancelledRestoreRef.current) return;
      if (text.length === 0 && loadedAttachments.length === 0) return;

      const attachmentIds = loadedAttachments.map((attachment) => attachment.attachmentId);
      const segments = composerParseDraftTransformer({ text, attachmentIds });
      const map = new Map(
        loadedAttachments.map((attachment) => [attachment.attachmentId, attachment] as const),
      );
      attachmentsRef.current = map;
      // These ids are what IndexedDB already holds — they were just read back out of it — so the
      // first keystroke after a restore must not immediately rewrite the store it was just loaded
      // from.
      lastSavedAttachmentIdsRef.current = attachmentIds;
      setIsEmpty(text.length === 0);

      const editor = editorRef.current;
      if (editor !== null) {
        domComposerWriteAdapter({ editor, segments, attachments: map });
      }
    } catch (error) {
      globalThis.console.error('[chat-input] failed to restore draft', error);
    }
  }, []);

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
            contentEditable={!isStreaming && !isSending}
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
