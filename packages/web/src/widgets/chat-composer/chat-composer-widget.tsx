/**
 * PURPOSE: The one composer both the chat panel and the clarify panel mount. It owns the
 * `contenteditable` editor (a div, not a `<textarea>`, so a pasted image renders as an inline
 * thumbnail at the caret), Enter-to-send, Shift+Enter newline, auto-grow, image paste, the image
 * overlay and the inline send button. It holds no draft storage and no upload progress bar — those
 * belong to the mount that wants them, which hears about content through `onContentChange` and
 * writes a restored draft back through `controlRef`. Reach for ChatInputWidget instead when the
 * surface also needs draft persistence, a STOP button and the upload bar.
 *
 * USAGE:
 * <ChatComposerWidget placeholder="Type an answer..." onSubmit={async ({ text, images }) => { ... }} />
 * // Enter or the send button calls onSubmit with the trimmed text and the pasted images. Resolving
 * // clears only what that send read; rejecting keeps the content and toasts the error message.
 * // `hasSelection` makes a blank composer submit { text: '', images: [] } because something outside
 * // the editor (a checked option card) counts as content to send.
 */

import { Blob } from '#gateway/browser/Blob';
import { consoleError } from '#gateway/browser/console';
import { HTMLImageElement } from '#gateway/browser/HTMLImageElement';
import { Box, UnstyledButton } from '#gateway/npm/mantine__core';
import { notifications } from '#gateway/npm/mantine__notifications';
import { useCallback, useEffect, useImperativeHandle, useRef, useState } from '#gateway/npm/react';
import type { RefObject } from '#gateway/npm/react';

import type { PastedImageUpload } from '@dungeonmaster/shared/contracts';
import { pastedImageMediaTypeContract } from '@dungeonmaster/shared/contracts';
import { pastedImageStatics } from '@dungeonmaster/shared/statics';

import { composerDeleteThumbnailBroker } from '../../brokers/composer/delete-thumbnail/composer-delete-thumbnail-broker';
import { composerInsertImageBroker } from '../../brokers/composer/insert-image/composer-insert-image-broker';
import { composerInsertTextBroker } from '../../brokers/composer/insert-text/composer-insert-text-broker';
import { composerWriteBroker } from '../../brokers/composer/write/composer-write-broker';
import { fileReadDataUrlBroker } from '../../brokers/file/read-data-url/file-read-data-url-broker';
import { pastedImageAttachBroker } from '../../brokers/pasted-image/attach/pasted-image-attach-broker';
import type { ComposerAttachment } from '../../contracts/composer-attachment/composer-attachment-contract';
import { composerAttachmentContract } from '../../contracts/composer-attachment/composer-attachment-contract';
import { composerSendPayloadContract } from '../../contracts/composer-send-payload/composer-send-payload-contract';
import { isAllowedPasteMediaTypeGuard } from '../../guards/is-allowed-paste-media-type/is-allowed-paste-media-type-guard';
import { chatComposerStatics } from '../../statics/chat-composer/chat-composer-statics';
import { emberDepthsThemeStatics } from '../../statics/ember-depths-theme/ember-depths-theme-statics';
import { composerReadTransformer } from '../../transformers/composer-read/composer-read-transformer';
import { composerSerializeTransformer } from '../../transformers/composer-serialize/composer-serialize-transformer';
import { dataUrlSplitTransformer } from '../../transformers/data-url-split/data-url-split-transformer';
import { pasteMediaTypeNormalizeTransformer } from '../../transformers/paste-media-type-normalize/paste-media-type-normalize-transformer';
import { ImageOverlayWidget } from '../image-overlay/image-overlay-widget';

const SEND_BUTTON_SIZE = 44;
const THUMBNAIL_SELECTOR = `img[${chatComposerStatics.thumbnail.attributeName}]`;

export interface ChatComposerControl {
  write: (params: {
    segments: Parameters<typeof composerWriteBroker>[0]['segments'];
    attachments: ReadonlyMap<ComposerAttachment['attachmentId'], ComposerAttachment>;
  }) => void;
  clear: () => void;
}

export interface ChatComposerWidgetProps {
  onSubmit: (params: { text: string; images: readonly PastedImageUpload[] }) => Promise<void>;
  placeholder: string;
  hasSelection?: boolean;
  onContentChange?: (params: { text: string; attachments: readonly ComposerAttachment[] }) => void;
  controlRef?: RefObject<ChatComposerControl | null>;
  sendControl?: React.JSX.Element;
  testIds?: { editor: string; placeholder: string; sendButton: string };
  children?: React.ReactNode;
}

export const ChatComposerWidget = ({
  onSubmit,
  placeholder,
  hasSelection = false,
  onContentChange,
  controlRef,
  sendControl,
  testIds = {
    editor: 'CHAT_INPUT',
    placeholder: 'CHAT_INPUT_PLACEHOLDER',
    sendButton: 'SEND_BUTTON',
  },
  children,
}: ChatComposerWidgetProps): React.JSX.Element => {
  const { colors } = emberDepthsThemeStatics;
  const editorRef = useRef<HTMLDivElement | null>(null);
  // A ref, not state — nothing React renders depends on the bytes, and a paste that needed the
  // "current" map right after setting it would read the stale pre-update state.
  const attachmentsRef = useRef<Map<ComposerAttachment['attachmentId'], ComposerAttachment>>(
    new Map(),
  );
  // Mirrors `isSending` for a synchronous read: two clicks in the same tick both close over the
  // render that was current when the burst started, so a state-only guard lets both through.
  const isSendingRef = useRef(false);
  const [overlaySrc, setOverlaySrc] = useState<string | null>(null);
  const [isEmpty, setIsEmpty] = useState(true);
  const [isSending, setIsSending] = useState(false);

  useImperativeHandle(
    controlRef,
    (): ChatComposerControl => ({
      write: ({ segments, attachments }) => {
        const editor = editorRef.current;
        if (editor === null) return;
        attachmentsRef.current = new Map(attachments);
        composerWriteBroker({ editor, segments, attachments });
        setIsEmpty(segments.length === 0);
      },
      clear: () => {
        const editor = editorRef.current;
        attachmentsRef.current = new Map();
        if (editor !== null) {
          composerWriteBroker({ editor, segments: [], attachments: new Map() });
        }
        setIsEmpty(true);
      },
    }),
    [],
  );

  const handleContentChanged = useCallback((): void => {
    const editor = editorRef.current;
    if (editor === null) return;

    const segments = composerReadTransformer({ editor });
    const { text, attachmentIds } = composerSerializeTransformer({ segments });

    setIsEmpty(text.length === 0);

    if (onContentChange === undefined) return;
    const attachments = attachmentIds
      .map((attachmentId) => attachmentsRef.current.get(attachmentId))
      .filter((attachment) => attachment !== undefined);
    onContentChange({ text, attachments });
  }, [onContentChange]);

  const handlePaste = useCallback(
    async (event: React.ClipboardEvent<HTMLDivElement>): Promise<void> => {
      const editor = editorRef.current;
      if (editor === null) return;

      // Both the selection test and the allow-list check read the SAME normalised type, so a file
      // item one side would call image-ish is never handed to the plain-text branch by the other.
      const items = Array.from(event.clipboardData.items);
      const imageItem = items.find((item) => {
        if (item.kind !== 'file') return false;
        const normalizedType = pasteMediaTypeNormalizeTransformer({ mediaType: item.type });
        return normalizedType === '' || normalizedType.startsWith('image/');
      });

      if (imageItem === undefined) {
        event.preventDefault();
        composerInsertTextBroker({ editor, text: event.clipboardData.getData('text/plain') });
        handleContentChanged();
        return;
      }

      // Prevented before any async work — a paste handled here must never also let the browser
      // insert its own unmanaged copy.
      event.preventDefault();

      const normalizedMediaType = pasteMediaTypeNormalizeTransformer({ mediaType: imageItem.type });

      if (!isAllowedPasteMediaTypeGuard({ mediaType: normalizedMediaType })) {
        notifications.show({
          message: chatComposerStatics.toasts.unsupportedFormat,
          color: chatComposerStatics.toastColor,
        });
        return;
      }

      // Counted from the DOM, not attachmentsRef: the limit is a promise about what the user SEES.
      const existingThumbnailCount = editor.querySelectorAll(THUMBNAIL_SELECTOR).length;

      if (existingThumbnailCount >= pastedImageStatics.maxImagesPerMessage) {
        notifications.show({
          message: chatComposerStatics.toasts.tooManyImages,
          color: chatComposerStatics.toastColor,
        });
        return;
      }

      const file = imageItem.getAsFile();
      if (file === null) return;

      try {
        // The Blob is retyped to the normalised value because FileReader embeds a Blob's own type
        // verbatim, untrimmed, and the data URL contract tolerates no whitespace in that segment.
        const dataUrl = await fileReadDataUrlBroker({
          blob: new Blob([file], { type: normalizedMediaType }),
        });
        const attachment = await pastedImageAttachBroker({
          dataUrl,
          mediaType: pastedImageMediaTypeContract.parse(normalizedMediaType),
        });

        // Re-read immediately before the insert: the count above ran before this function's first
        // `await`, so a second in-flight paste may have committed since.
        const committedThumbnailCount = editor.querySelectorAll(THUMBNAIL_SELECTOR).length;
        if (committedThumbnailCount >= pastedImageStatics.maxImagesPerMessage) {
          notifications.show({
            message: chatComposerStatics.toasts.tooManyImages,
            color: chatComposerStatics.toastColor,
          });
          return;
        }

        composerInsertImageBroker({ editor, attachment });
        attachmentsRef.current.set(attachment.attachmentId, attachment);
        handleContentChanged();
      } catch {
        // A ladder that bottoms out and an image that will not decode read the same to the user.
        notifications.show({
          message: chatComposerStatics.toasts.cannotReduce,
          color: chatComposerStatics.toastColor,
        });
      }
    },
    [handleContentChanged],
  );

  // Locked at the first line so one Enter is one submit, and cleared ONLY on acceptance: the
  // composer survives a rejection with its text and thumbnails intact.
  const handleSend = useCallback((): void => {
    const editor = editorRef.current;
    if (editor === null) return;
    if (isSendingRef.current) return;

    const segments = composerReadTransformer({ editor });
    const { text, attachmentIds } = composerSerializeTransformer({ segments });
    const trimmed = text.trim();
    if (trimmed.length === 0 && attachmentIds.length === 0 && !hasSelection) return;

    const orderedAttachments = attachmentIds
      .map((attachmentId) => attachmentsRef.current.get(attachmentId))
      .filter((attachment) => attachment !== undefined);

    const payload = composerSendPayloadContract.parse({
      message: trimmed,
      attachments: orderedAttachments,
    });
    const images = payload.attachments.map((attachment) =>
      dataUrlSplitTransformer({ dataUrl: attachment.dataUrl }),
    );

    // Only the nodes and attachment ids THIS send read are removed on success, so content that
    // arrives while the request is in flight survives untouched.
    const sentNodes = Array.from(editor.childNodes);
    const sentAttachmentIds = payload.attachments.map((attachment) => attachment.attachmentId);

    isSendingRef.current = true;
    setIsSending(true);

    onSubmit({ text: payload.message, images })
      .then(() => {
        for (const node of sentNodes) {
          if (node.parentNode === editor) {
            editor.removeChild(node);
          }
        }
        for (const attachmentId of sentAttachmentIds) {
          attachmentsRef.current.delete(attachmentId);
        }
        handleContentChanged();
      })
      .catch((error: unknown) => {
        notifications.show({
          message: error instanceof Error ? error.message : String(error),
          color: chatComposerStatics.toastColor,
        });
      })
      .finally(() => {
        isSendingRef.current = false;
        setIsSending(false);
      });
  }, [onSubmit, hasSelection, handleContentChanged]);

  const handleKeyDown = useCallback(
    (event: React.KeyboardEvent<HTMLDivElement>): void => {
      const editor = editorRef.current;
      if (editor === null) return;

      // A contenteditable's own Enter inserts a block element, not a newline. Handled explicitly
      // so Shift+Enter inserts exactly one '\n'.
      if (event.key === 'Enter' && event.shiftKey) {
        event.preventDefault();
        composerInsertTextBroker({ editor, text: '\n' });
        handleContentChanged();
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

    const attachment = attachmentsRef.current.get(
      composerAttachmentContract.shape.attachmentId.parse(rawAttachmentId),
    );
    if (attachment === undefined) return;

    setOverlaySrc(attachment.dataUrl);
  }, []);

  // Native listener, not React's onBeforeInput — the synthetic version carries no `inputType`,
  // the only signal that tells a plain keystroke from a delete reaching through a thumbnail.
  const handleBeforeInput = useCallback(
    (event: InputEvent): void => {
      const editor = editorRef.current;
      if (editor === null) return;

      if (
        event.inputType === 'deleteContentBackward' ||
        event.inputType === 'deleteContentForward'
      ) {
        const removedAttachmentId = composerDeleteThumbnailBroker({
          editor,
          direction: event.inputType === 'deleteContentBackward' ? 'backward' : 'forward',
        });

        if (removedAttachmentId !== undefined) {
          event.preventDefault();
          attachmentsRef.current.delete(removedAttachmentId);
          handleContentChanged();
        }
        return;
      }

      if (event.inputType === 'insertText') {
        // Intercepted only while the composer holds a thumbnail, so Playwright's `.fill()` against
        // a plain-text composer stays on the browser's native insertion path.
        const hasThumbnail = editor.querySelector(THUMBNAIL_SELECTOR) !== null;
        if (hasThumbnail) {
          event.preventDefault();
          composerInsertTextBroker({ editor, text: event.data ?? '' });
          handleContentChanged();
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

  return (
    <Box style={{ padding: 12 }}>
      <div style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
        <div style={{ flex: 1, position: 'relative' }}>
          <div
            data-testid={testIds.editor}
            ref={editorRef}
            contentEditable={!isSending}
            suppressContentEditableWarning
            onPaste={(event) => {
              handlePaste(event).catch((error: unknown) => {
                consoleError('[chat-composer] paste handler failed', error);
              });
            }}
            onInput={handleContentChanged}
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
              data-testid={testIds.placeholder}
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
              {placeholder}
            </div>
          ) : null}
          {children}
        </div>
        {sendControl ?? (
          <UnstyledButton
            data-testid={testIds.sendButton}
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
