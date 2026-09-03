import { fireEvent, screen, waitFor } from '@testing-library/react';

import { PastedImageUploadStub } from '@dungeonmaster/shared/contracts';
import { pastedImageStatics } from '@dungeonmaster/shared/statics';

import { domComposerInsertImageAdapter } from '../../adapters/dom/composer-insert-image/dom-composer-insert-image-adapter';
import { domComposerReadAdapter } from '../../adapters/dom/composer-read/dom-composer-read-adapter';
import { mantineRenderAdapter } from '../../adapters/mantine/render/mantine-render-adapter';
import { draftImagesSaveBroker } from '../../brokers/draft-images/save/draft-images-save-broker';
import { ByteLengthStub } from '../../contracts/byte-length/byte-length.stub';
import { ComposerAttachmentStub } from '../../contracts/composer-attachment/composer-attachment.stub';
import { chatComposerStatics } from '../../statics/chat-composer/chat-composer-statics';
import { base64ByteLengthTransformer } from '../../transformers/base64-byte-length/base64-byte-length-transformer';
import { ChatInputWidget } from './chat-input-widget';
import type { ChatInputWidgetProps } from './chat-input-widget';
import { ChatInputWidgetProxy } from './chat-input-widget.proxy';

// Derived from the widget's own prop type via a type query rather than importing UserInput /
// PastedImageUpload / UploadProgressHandler from their contracts directly — test files cannot
// import types from contracts, and this stays in sync with whatever onSendMessage actually accepts.
type OnSendMessageParams = Parameters<ChatInputWidgetProps['onSendMessage']>[0];

describe('ChatInputWidget', () => {
  describe('rendering', () => {
    it('VALID: {fresh mount} => #check-composer-is-contenteditable renders CHAT_INPUT editable with zero thumbnails', () => {
      const proxy = ChatInputWidgetProxy();
      proxy.clearStorage();

      mantineRenderAdapter({
        ui: (
          <ChatInputWidget
            isStreaming={false}
            onSendMessage={jest.fn(async (): Promise<void> => Promise.resolve())}
            onStopChat={jest.fn()}
          />
        ),
      });

      expect(screen.getByTestId('CHAT_INPUT').getAttribute('contenteditable')).toBe('true');
      expect(proxy.getThumbnailSrcs()).toStrictEqual([]);
    });

    it('VALID: {isStreaming: true} => renders STOP_BUTTON, no SEND_BUTTON, and a non-editable editor', () => {
      const proxy = ChatInputWidgetProxy();
      proxy.clearStorage();

      mantineRenderAdapter({
        ui: (
          <ChatInputWidget
            isStreaming={true}
            onSendMessage={jest.fn(async (): Promise<void> => Promise.resolve())}
            onStopChat={jest.fn()}
          />
        ),
      });

      expect(screen.getByTestId('STOP_BUTTON')).toBe(screen.getByTestId('STOP_BUTTON'));
      expect(screen.queryByTestId('SEND_BUTTON')).toBe(null);
      expect(screen.getByTestId('CHAT_INPUT').getAttribute('contenteditable')).toBe('false');
    });
  });

  describe('image paste - default prevented', () => {
    it('VALID: {paste image/png} => #check-image-paste-default-prevented calls preventDefault', () => {
      const proxy = ChatInputWidgetProxy();
      proxy.clearStorage();
      proxy.attachFails({ error: new Error('unused by this assertion') });

      mantineRenderAdapter({
        ui: (
          <ChatInputWidget
            isStreaming={false}
            onSendMessage={jest.fn(async (): Promise<void> => Promise.resolve())}
            onStopChat={jest.fn()}
          />
        ),
      });

      const editor = screen.getByTestId('CHAT_INPUT');
      const clipboardData = proxy.pasteImage({
        mediaType: 'image/png',
        bytes: new Uint8Array([137, 80, 78, 71]),
      });

      expect(fireEvent.paste(editor, { clipboardData })).toBe(false);
    });
  });

  describe('image paste - unsupported format', () => {
    it('INVALID: {paste image/bmp} => #check-format-toast-text shows the unsupported-format toast', () => {
      const proxy = ChatInputWidgetProxy();
      proxy.clearStorage();

      mantineRenderAdapter({
        ui: (
          <ChatInputWidget
            isStreaming={false}
            onSendMessage={jest.fn(async (): Promise<void> => Promise.resolve())}
            onStopChat={jest.fn()}
          />
        ),
      });

      const editor = screen.getByTestId('CHAT_INPUT');
      const clipboardData = proxy.pasteImage({
        mediaType: 'image/bmp',
        bytes: new Uint8Array([1, 2]),
      });
      fireEvent.paste(editor, { clipboardData });

      expect(proxy.getShownToast()).toStrictEqual({
        message: chatComposerStatics.toasts.unsupportedFormat,
        color: chatComposerStatics.toastColor,
      });
    });

    it('INVALID: {paste image/bmp} => #check-format-inserts-nothing leaves the composer unchanged', () => {
      const proxy = ChatInputWidgetProxy();
      proxy.clearStorage();

      mantineRenderAdapter({
        ui: (
          <ChatInputWidget
            isStreaming={false}
            onSendMessage={jest.fn(async (): Promise<void> => Promise.resolve())}
            onStopChat={jest.fn()}
          />
        ),
      });

      const editor = screen.getByTestId('CHAT_INPUT');
      const before = editor.innerHTML;
      const clipboardData = proxy.pasteImage({
        mediaType: 'image/bmp',
        bytes: new Uint8Array([1, 2]),
      });
      fireEvent.paste(editor, { clipboardData });

      expect(editor.innerHTML).toBe(before);
    });
  });

  // A real browser's File/Blob constructor ASCII-lowercases a `type` string at construction time
  // (confirmed against Node's own spec-following Blob: `new Blob([], {type: 'IMAGE/PNG'}).type`
  // returns 'image/png'), so a Playwright e2e pasting a wrong-case type through `new File(...)` can
  // never actually observe the bug — the browser has already normalised it away before handlePaste
  // ever reads `item.type`. `ChatInputWidgetProxy.pasteImage` sets the mock DataTransferItem's own
  // `type` directly from the raw `mediaType` argument (not from the File/Blob it separately
  // constructs), so this is the one layer that can hand handlePaste a genuinely un-normalised,
  // wrong-case declared type — which is what this case needs to reproduce for real.
  describe('image paste - wrong-case declared type', () => {
    it('EDGE: {paste a clipboard item declared "IMAGE/PNG"} => #check-wrong-case-accepted-as-png accepts it as PNG and never shows the unsupported-format toast', async () => {
      const proxy = ChatInputWidgetProxy();
      proxy.clearStorage();

      mantineRenderAdapter({
        ui: (
          <ChatInputWidget
            isStreaming={false}
            onSendMessage={jest.fn(async (): Promise<void> => Promise.resolve())}
            onStopChat={jest.fn()}
          />
        ),
      });

      const editor = screen.getByTestId('CHAT_INPUT');
      proxy.attachYields({
        attachment: ComposerAttachmentStub({
          attachmentId: 'c0000000-0000-4000-8000-000000000001',
        }),
      });
      const clipboardData = proxy.pasteImage({
        mediaType: 'IMAGE/PNG',
        bytes: new Uint8Array([1, 2, 3, 4]),
      });
      fireEvent.paste(editor, { clipboardData });

      // Asserted by SRC (derived from the pasted bytes), not by the minted attachmentId — the
      // preceding "default prevented" test above fires an un-awaited handlePaste whose own
      // crypto.randomUUID() call can still be in flight when this test starts, racing this test's
      // own staged mintsIds() for the shared crypto.randomUUID mock. The src is deterministic
      // regardless of which of the two calls wins that race.
      await waitFor(() => {
        expect(proxy.getThumbnailSrcs()).toStrictEqual(['data:image/png;base64,AQIDBA==']);
      });

      expect(proxy.getShownToast()).toBe(undefined);
    });
  });

  describe('image paste - too many images', () => {
    it('INVALID: {6th image over the cap} => #check-limit-toast-text shows the too-many-images toast', () => {
      const proxy = ChatInputWidgetProxy();
      proxy.clearStorage();

      mantineRenderAdapter({
        ui: (
          <ChatInputWidget
            isStreaming={false}
            onSendMessage={jest.fn(async (): Promise<void> => Promise.resolve())}
            onStopChat={jest.fn()}
          />
        ),
      });

      const editor = screen.getByTestId('CHAT_INPUT');
      Array.from({ length: pastedImageStatics.maxImagesPerMessage }, (_value, index) =>
        ComposerAttachmentStub({
          attachmentId: `00000000-0000-4000-8000-00000000000${String(index + 1)}`,
          dataUrl: `data:image/png;base64,SEED${String(index)}AAAAAAAA`,
        }),
      ).forEach((attachment) => {
        domComposerInsertImageAdapter({ editor, attachment });
      });

      const clipboardData = proxy.pasteImage({
        mediaType: 'image/png',
        bytes: new Uint8Array([9, 9, 9, 9]),
      });
      fireEvent.paste(editor, { clipboardData });

      expect(proxy.getShownToast()).toStrictEqual({
        message: chatComposerStatics.toasts.tooManyImages,
        color: chatComposerStatics.toastColor,
      });
    });

    it('INVALID: {6th image over the cap} => #check-limit-count-unchanged leaves the existing thumbnail srcs unchanged and in order', () => {
      const proxy = ChatInputWidgetProxy();
      proxy.clearStorage();

      mantineRenderAdapter({
        ui: (
          <ChatInputWidget
            isStreaming={false}
            onSendMessage={jest.fn(async (): Promise<void> => Promise.resolve())}
            onStopChat={jest.fn()}
          />
        ),
      });

      const editor = screen.getByTestId('CHAT_INPUT');
      Array.from({ length: pastedImageStatics.maxImagesPerMessage }, (_value, index) =>
        ComposerAttachmentStub({
          attachmentId: `00000000-0000-4000-8000-00000000000${String(index + 1)}`,
          dataUrl: `data:image/png;base64,SEED${String(index)}AAAAAAAA`,
        }),
      ).forEach((attachment) => {
        domComposerInsertImageAdapter({ editor, attachment });
      });

      const before = proxy.getThumbnailSrcs();
      const clipboardData = proxy.pasteImage({
        mediaType: 'image/png',
        bytes: new Uint8Array([9, 9, 9, 9]),
      });
      fireEvent.paste(editor, { clipboardData });

      expect(proxy.getThumbnailSrcs()).toStrictEqual(before);
    });

    it('INVALID: {distinctive 6th image over the cap} => #check-limit-does-not-replace inserts none of its bytes', () => {
      const proxy = ChatInputWidgetProxy();
      proxy.clearStorage();

      mantineRenderAdapter({
        ui: (
          <ChatInputWidget
            isStreaming={false}
            onSendMessage={jest.fn(async (): Promise<void> => Promise.resolve())}
            onStopChat={jest.fn()}
          />
        ),
      });

      const editor = screen.getByTestId('CHAT_INPUT');
      Array.from({ length: pastedImageStatics.maxImagesPerMessage }, (_value, index) =>
        ComposerAttachmentStub({
          attachmentId: `00000000-0000-4000-8000-00000000000${String(index + 1)}`,
          dataUrl: `data:image/png;base64,SEED${String(index)}AAAAAAAA`,
        }),
      ).forEach((attachment) => {
        domComposerInsertImageAdapter({ editor, attachment });
      });

      const before = proxy.getThumbnailSrcs();
      // Distinctive bytes distinct from every seeded dataUrl above — a silent replacement or
      // append would surface a base64 payload derived from THESE bytes in the src list.
      const clipboardData = proxy.pasteImage({
        mediaType: 'image/png',
        bytes: new Uint8Array([250, 251, 252, 253, 254, 255]),
      });
      fireEvent.paste(editor, { clipboardData });

      expect(proxy.getThumbnailSrcs()).toStrictEqual(before);
    });
  });

  describe('image paste - attach failure', () => {
    it('ERROR: {attach broker ladder failure} => #check-too-large-toast-text shows the cannot-reduce toast', async () => {
      const proxy = ChatInputWidgetProxy();
      proxy.clearStorage();
      proxy.attachFails({
        error: new Error('exceeds the byte ceiling even at the downscale floor'),
      });

      mantineRenderAdapter({
        ui: (
          <ChatInputWidget
            isStreaming={false}
            onSendMessage={jest.fn(async (): Promise<void> => Promise.resolve())}
            onStopChat={jest.fn()}
          />
        ),
      });

      const editor = screen.getByTestId('CHAT_INPUT');
      const clipboardData = proxy.pasteImage({
        mediaType: 'image/png',
        bytes: new Uint8Array([1, 2, 3, 4]),
      });
      fireEvent.paste(editor, { clipboardData });

      await waitFor(() => {
        expect(proxy.getShownToast()).toStrictEqual({
          message: chatComposerStatics.toasts.cannotReduce,
          color: chatComposerStatics.toastColor,
        });
      });

      expect(proxy.getShownToast()).toStrictEqual({
        message: chatComposerStatics.toasts.cannotReduce,
        color: chatComposerStatics.toastColor,
      });
    });

    it('ERROR: {attach broker decode failure} => #check-corrupt-image-same-toast shows the same toast and inserts nothing', async () => {
      const proxy = ChatInputWidgetProxy();
      proxy.clearStorage();
      proxy.attachFails({ error: new Error('failed to decode image') });

      mantineRenderAdapter({
        ui: (
          <ChatInputWidget
            isStreaming={false}
            onSendMessage={jest.fn(async (): Promise<void> => Promise.resolve())}
            onStopChat={jest.fn()}
          />
        ),
      });

      const editor = screen.getByTestId('CHAT_INPUT');
      const clipboardData = proxy.pasteImage({
        mediaType: 'image/png',
        bytes: new Uint8Array([1, 2, 3, 4]),
      });
      fireEvent.paste(editor, { clipboardData });

      await waitFor(() => {
        expect(proxy.getShownToast()).toStrictEqual({
          message: chatComposerStatics.toasts.cannotReduce,
          color: chatComposerStatics.toastColor,
        });
      });

      expect(proxy.getThumbnailSrcs()).toStrictEqual([]);
    });
  });

  describe('text paste', () => {
    it('VALID: {plain text paste} => inserts the text and leaves zero thumbnails', () => {
      const proxy = ChatInputWidgetProxy();
      proxy.clearStorage();

      mantineRenderAdapter({
        ui: (
          <ChatInputWidget
            isStreaming={false}
            onSendMessage={jest.fn(async (): Promise<void> => Promise.resolve())}
            onStopChat={jest.fn()}
          />
        ),
      });

      const editor = screen.getByTestId('CHAT_INPUT');
      const clipboardData = proxy.pasteText({ text: 'plain text' });
      fireEvent.paste(editor, { clipboardData });

      expect(proxy.getEditorChildren()).toStrictEqual([{ nodeName: '#text', text: 'plain text' }]);
      expect(proxy.getThumbnailSrcs()).toStrictEqual([]);
    });
  });

  describe('send message', () => {
    it('VALID: {type text, press Enter} => calls onSendMessage with the composed text', () => {
      const proxy = ChatInputWidgetProxy();
      proxy.clearStorage();
      const onSendMessage = jest.fn(
        async (_params: OnSendMessageParams): Promise<void> => Promise.resolve(),
      );

      mantineRenderAdapter({
        ui: (
          <ChatInputWidget
            isStreaming={false}
            onSendMessage={onSendMessage}
            onStopChat={jest.fn()}
          />
        ),
      });

      const editor = screen.getByTestId('CHAT_INPUT');
      const clipboardData = proxy.pasteText({ text: 'hello world' });
      fireEvent.paste(editor, { clipboardData });
      fireEvent.keyDown(editor, { key: 'Enter', shiftKey: false });

      expect(onSendMessage).toHaveBeenCalledWith({ message: 'hello world' });
    });

    it('VALID: {type text, press Shift+Enter} => does not call onSendMessage', () => {
      const proxy = ChatInputWidgetProxy();
      proxy.clearStorage();
      const onSendMessage = jest.fn(async (): Promise<void> => Promise.resolve());

      mantineRenderAdapter({
        ui: (
          <ChatInputWidget
            isStreaming={false}
            onSendMessage={onSendMessage}
            onStopChat={jest.fn()}
          />
        ),
      });

      const editor = screen.getByTestId('CHAT_INPUT');
      const clipboardData = proxy.pasteText({ text: 'hello world' });
      fireEvent.paste(editor, { clipboardData });
      fireEvent.keyDown(editor, { key: 'Enter', shiftKey: true });

      expect(onSendMessage.mock.calls).toStrictEqual([]);
    });

    it('VALID: {click SEND on an empty composer} => does not call onSendMessage', () => {
      const proxy = ChatInputWidgetProxy();
      proxy.clearStorage();
      const onSendMessage = jest.fn(async (): Promise<void> => Promise.resolve());

      mantineRenderAdapter({
        ui: (
          <ChatInputWidget
            isStreaming={false}
            onSendMessage={onSendMessage}
            onStopChat={jest.fn()}
          />
        ),
      });

      fireEvent.click(screen.getByTestId('SEND_BUTTON'));

      expect(onSendMessage.mock.calls).toStrictEqual([]);
    });
  });

  describe('typing around a thumbnail', () => {
    // `beforeinput` only carries `inputType` as a native InputEvent — React's synthetic
    // onBeforeInput does not — so these three drive the DOM event directly, matching
    // handleBeforeInput's own listener registration (editor.addEventListener('beforeinput', ...)).
    it('VALID: {paste an image into an empty composer, then type "x"} => #check-caret-sits-after-thumbnail places the typed text after the thumbnail', async () => {
      const proxy = ChatInputWidgetProxy();
      proxy.clearStorage();

      mantineRenderAdapter({
        ui: (
          <ChatInputWidget
            isStreaming={false}
            onSendMessage={jest.fn(async (): Promise<void> => Promise.resolve())}
            onStopChat={jest.fn()}
          />
        ),
      });

      const editor = screen.getByTestId('CHAT_INPUT');
      proxy.attachYields({
        attachment: ComposerAttachmentStub({
          attachmentId: '10000000-0000-4000-8000-000000000001',
        }),
      });
      fireEvent.paste(editor, {
        clipboardData: proxy.pasteImage({
          mediaType: 'image/png',
          bytes: new Uint8Array([1, 2, 3, 4]),
        }),
      });

      await waitFor(() => {
        expect(proxy.getThumbnailAttachmentIds()).toStrictEqual([
          '10000000-0000-4000-8000-000000000001',
        ]);
      });

      editor.dispatchEvent(
        new InputEvent('beforeinput', {
          inputType: 'insertText',
          data: 'x',
          bubbles: true,
          cancelable: true,
        }),
      );

      expect(proxy.getEditorChildren()).toStrictEqual([
        { nodeName: 'IMG', text: '' },
        { nodeName: '#text', text: 'x' },
      ]);
    });

    it('VALID: {paste an image into an empty composer, then type "x" with no space keyed} => #check-typing-after-thumbnail-needs-no-space keeps the thumbnail and typed text as separate siblings', async () => {
      const proxy = ChatInputWidgetProxy();
      proxy.clearStorage();

      mantineRenderAdapter({
        ui: (
          <ChatInputWidget
            isStreaming={false}
            onSendMessage={jest.fn(async (): Promise<void> => Promise.resolve())}
            onStopChat={jest.fn()}
          />
        ),
      });

      const editor = screen.getByTestId('CHAT_INPUT');
      proxy.attachYields({
        attachment: ComposerAttachmentStub({
          attachmentId: '10000000-0000-4000-8000-000000000002',
        }),
      });
      fireEvent.paste(editor, {
        clipboardData: proxy.pasteImage({
          mediaType: 'image/png',
          bytes: new Uint8Array([1, 2, 3, 4]),
        }),
      });

      await waitFor(() => {
        expect(proxy.getThumbnailAttachmentIds()).toStrictEqual([
          '10000000-0000-4000-8000-000000000002',
        ]);
      });

      editor.dispatchEvent(
        new InputEvent('beforeinput', {
          inputType: 'insertText',
          data: 'x',
          bubbles: true,
          cancelable: true,
        }),
      );

      expect(proxy.getEditorChildren()).toStrictEqual([
        { nodeName: 'IMG', text: '' },
        { nodeName: '#text', text: 'x' },
      ]);
      // The thumbnail's own textContent, read directly off the <img> — proves the 'x' landed as a
      // sibling text node rather than inside the (atomic, childless) thumbnail element.
      expect(screen.getByTestId(chatComposerStatics.thumbnail.testId).textContent).toBe('');
    });

    it('VALID: {paste an image, then type a space, then "b"} => #check-space-after-thumbnail-survives keeps the leading space', async () => {
      const proxy = ChatInputWidgetProxy();
      proxy.clearStorage();

      mantineRenderAdapter({
        ui: (
          <ChatInputWidget
            isStreaming={false}
            onSendMessage={jest.fn(async (): Promise<void> => Promise.resolve())}
            onStopChat={jest.fn()}
          />
        ),
      });

      const editor = screen.getByTestId('CHAT_INPUT');
      proxy.attachYields({
        attachment: ComposerAttachmentStub({
          attachmentId: '10000000-0000-4000-8000-000000000003',
        }),
      });
      fireEvent.paste(editor, {
        clipboardData: proxy.pasteImage({
          mediaType: 'image/png',
          bytes: new Uint8Array([1, 2, 3, 4]),
        }),
      });

      await waitFor(() => {
        expect(proxy.getThumbnailAttachmentIds()).toStrictEqual([
          '10000000-0000-4000-8000-000000000003',
        ]);
      });

      editor.dispatchEvent(
        new InputEvent('beforeinput', {
          inputType: 'insertText',
          data: ' ',
          bubbles: true,
          cancelable: true,
        }),
      );
      editor.dispatchEvent(
        new InputEvent('beforeinput', {
          inputType: 'insertText',
          data: 'b',
          bubbles: true,
          cancelable: true,
        }),
      );

      // Two back-to-back inserts each collapse the caret via Range#setStartAfter, a PARENT-relative
      // boundary — so the browser leaves the space and "b" as two sibling text nodes, not one. Only
      // domComposerReadAdapter's own merge (same one handleContentChanged relies on) reports them as
      // a single logical run; a raw child-node snapshot here would see three siblings, not two, and
      // assert something this widget never promised.
      const segments = domComposerReadAdapter({ editor });

      expect(segments.map((segment) => segment.kind)).toStrictEqual(['image', 'text']);
      expect(editor.textContent).toBe(' b');
    });
  });

  describe('ordering and identity', () => {
    it('VALID: {text "A", image, text "B", image, text "C"} => #check-two-images-keep-their-places preserves left-to-right order', async () => {
      const proxy = ChatInputWidgetProxy();
      proxy.clearStorage();

      mantineRenderAdapter({
        ui: (
          <ChatInputWidget
            isStreaming={false}
            onSendMessage={jest.fn(async (): Promise<void> => Promise.resolve())}
            onStopChat={jest.fn()}
          />
        ),
      });

      const editor = screen.getByTestId('CHAT_INPUT');
      fireEvent.paste(editor, { clipboardData: proxy.pasteText({ text: 'A' }) });

      proxy.attachYields({
        attachment: ComposerAttachmentStub({
          attachmentId: '20000000-0000-4000-8000-000000000001',
        }),
      });
      fireEvent.paste(editor, {
        clipboardData: proxy.pasteImage({
          mediaType: 'image/png',
          bytes: new Uint8Array([1, 2, 3, 4]),
        }),
      });
      await waitFor(() => {
        expect(proxy.getThumbnailAttachmentIds()).toStrictEqual([
          '20000000-0000-4000-8000-000000000001',
        ]);
      });

      fireEvent.paste(editor, { clipboardData: proxy.pasteText({ text: 'B' }) });

      proxy.attachYields({
        attachment: ComposerAttachmentStub({
          attachmentId: '20000000-0000-4000-8000-000000000002',
        }),
      });
      fireEvent.paste(editor, {
        clipboardData: proxy.pasteImage({
          mediaType: 'image/png',
          bytes: new Uint8Array([5, 6, 7, 8]),
        }),
      });
      await waitFor(() => {
        expect(proxy.getThumbnailAttachmentIds()).toStrictEqual([
          '20000000-0000-4000-8000-000000000001',
          '20000000-0000-4000-8000-000000000002',
        ]);
      });

      fireEvent.paste(editor, { clipboardData: proxy.pasteText({ text: 'C' }) });

      expect(proxy.getEditorChildren()).toStrictEqual([
        { nodeName: '#text', text: 'A' },
        { nodeName: 'IMG', text: '' },
        { nodeName: '#text', text: 'B' },
        { nodeName: 'IMG', text: '' },
        { nodeName: '#text', text: 'C' },
      ]);
    });

    it('VALID: {the identical clipboard item pasted twice} => #check-same-clipboard-twice-gives-two-thumbnails inserts two thumbnails', async () => {
      const proxy = ChatInputWidgetProxy();
      proxy.clearStorage();

      mantineRenderAdapter({
        ui: (
          <ChatInputWidget
            isStreaming={false}
            onSendMessage={jest.fn(async (): Promise<void> => Promise.resolve())}
            onStopChat={jest.fn()}
          />
        ),
      });

      const editor = screen.getByTestId('CHAT_INPUT');
      const bytes = new Uint8Array([9, 9, 8, 8, 7, 7]);

      proxy.attachYields({
        attachment: ComposerAttachmentStub({
          attachmentId: '30000000-0000-4000-8000-000000000001',
        }),
      });
      fireEvent.paste(editor, {
        clipboardData: proxy.pasteImage({ mediaType: 'image/png', bytes }),
      });
      await waitFor(() => {
        expect(proxy.getThumbnailAttachmentIds()).toStrictEqual([
          '30000000-0000-4000-8000-000000000001',
        ]);
      });

      proxy.attachYields({
        attachment: ComposerAttachmentStub({
          attachmentId: '30000000-0000-4000-8000-000000000002',
        }),
      });
      fireEvent.paste(editor, {
        clipboardData: proxy.pasteImage({ mediaType: 'image/png', bytes }),
      });

      await waitFor(() => {
        expect(proxy.getThumbnailAttachmentIds()).toStrictEqual([
          '30000000-0000-4000-8000-000000000001',
          '30000000-0000-4000-8000-000000000002',
        ]);
      });

      expect(proxy.getThumbnailAttachmentIds()).toStrictEqual([
        '30000000-0000-4000-8000-000000000001',
        '30000000-0000-4000-8000-000000000002',
      ]);
    });

    it('VALID: {the identical clipboard item pasted twice} => #check-same-clipboard-twice-distinct-ids mints two different attachment ids', async () => {
      const proxy = ChatInputWidgetProxy();
      proxy.clearStorage();

      mantineRenderAdapter({
        ui: (
          <ChatInputWidget
            isStreaming={false}
            onSendMessage={jest.fn(async (): Promise<void> => Promise.resolve())}
            onStopChat={jest.fn()}
          />
        ),
      });

      const editor = screen.getByTestId('CHAT_INPUT');
      const bytes = new Uint8Array([9, 9, 8, 8, 7, 7]);

      proxy.attachYields({
        attachment: ComposerAttachmentStub({
          attachmentId: '30000000-0000-4000-8000-000000000003',
        }),
      });
      fireEvent.paste(editor, {
        clipboardData: proxy.pasteImage({ mediaType: 'image/png', bytes }),
      });
      await waitFor(() => {
        expect(proxy.getThumbnailAttachmentIds()).toStrictEqual([
          '30000000-0000-4000-8000-000000000003',
        ]);
      });

      proxy.attachYields({
        attachment: ComposerAttachmentStub({
          attachmentId: '30000000-0000-4000-8000-000000000004',
        }),
      });
      fireEvent.paste(editor, {
        clipboardData: proxy.pasteImage({ mediaType: 'image/png', bytes }),
      });

      await waitFor(() => {
        expect(proxy.getThumbnailAttachmentIds()).toStrictEqual([
          '30000000-0000-4000-8000-000000000003',
          '30000000-0000-4000-8000-000000000004',
        ]);
      });

      expect(proxy.getThumbnailAttachmentIds()).toStrictEqual([
        '30000000-0000-4000-8000-000000000003',
        '30000000-0000-4000-8000-000000000004',
      ]);
    });

    it('VALID: {the identical clipboard item pasted twice} => #check-same-clipboard-twice-same-bytes gives both attachments byte-identical src strings', async () => {
      const proxy = ChatInputWidgetProxy();
      proxy.clearStorage();

      mantineRenderAdapter({
        ui: (
          <ChatInputWidget
            isStreaming={false}
            onSendMessage={jest.fn(async (): Promise<void> => Promise.resolve())}
            onStopChat={jest.fn()}
          />
        ),
      });

      const editor = screen.getByTestId('CHAT_INPUT');
      const bytes = new Uint8Array([9, 9, 8, 8, 7, 7]);

      proxy.attachYields({
        attachment: ComposerAttachmentStub({
          attachmentId: '30000000-0000-4000-8000-000000000005',
        }),
      });
      fireEvent.paste(editor, {
        clipboardData: proxy.pasteImage({ mediaType: 'image/png', bytes }),
      });
      await waitFor(() => {
        expect(proxy.getThumbnailAttachmentIds()).toStrictEqual([
          '30000000-0000-4000-8000-000000000005',
        ]);
      });

      proxy.attachYields({
        attachment: ComposerAttachmentStub({
          attachmentId: '30000000-0000-4000-8000-000000000006',
        }),
      });
      fireEvent.paste(editor, {
        clipboardData: proxy.pasteImage({ mediaType: 'image/png', bytes }),
      });
      await waitFor(() => {
        expect(proxy.getThumbnailAttachmentIds()).toStrictEqual([
          '30000000-0000-4000-8000-000000000005',
          '30000000-0000-4000-8000-000000000006',
        ]);
      });

      const [firstSrc, secondSrc] = proxy.getThumbnailSrcs();

      expect(firstSrc).toBe(secondSrc);
    });
  });

  describe('the saved draft', () => {
    it('VALID: {text "A", image, text "B"} => #check-draft-text-holds-tokens saves the exact placeholder string to localStorage', async () => {
      const proxy = ChatInputWidgetProxy();
      proxy.clearStorage();

      mantineRenderAdapter({
        ui: (
          <ChatInputWidget
            isStreaming={false}
            onSendMessage={jest.fn(async (): Promise<void> => Promise.resolve())}
            onStopChat={jest.fn()}
          />
        ),
      });

      const editor = screen.getByTestId('CHAT_INPUT');
      fireEvent.paste(editor, { clipboardData: proxy.pasteText({ text: 'A' }) });

      proxy.attachYields({
        attachment: ComposerAttachmentStub({
          attachmentId: '40000000-0000-4000-8000-000000000001',
        }),
      });
      fireEvent.paste(editor, {
        clipboardData: proxy.pasteImage({
          mediaType: 'image/png',
          bytes: new Uint8Array([1, 2, 3, 4]),
        }),
      });
      await waitFor(() => {
        expect(proxy.getThumbnailAttachmentIds()).toStrictEqual([
          '40000000-0000-4000-8000-000000000001',
        ]);
      });

      fireEvent.paste(editor, { clipboardData: proxy.pasteText({ text: 'B' }) });

      expect(localStorage.getItem(chatComposerStatics.draftStorageKey)).toBe('A[Pasted Image 1]B');
    });
  });

  describe('the reload restore', () => {
    // Simulated by unmounting and re-rendering the SAME widget inside one test — real localStorage
    // and the fake IndexedDB the proxy installs both persist across that unmount, exactly as the
    // browser's own storage survives a real page reload.
    //
    // This is also the only place the write and read halves of the draft-images round trip meet.
    // domComposerWriteAdapter's own test cannot import domComposerReadAdapter's test (or vice
    // versa) — enforce-import-dependencies forbids one adapter's test importing a sibling adapter —
    // but this widget mounts both, so remounting it after a real paste IS that round trip.
    it('VALID: {reload after a draft with text "A", an image, and text "B"} => #check-reload-rebuilds-thumbnail restores text, thumbnail, text in order', async () => {
      const proxy = ChatInputWidgetProxy();
      proxy.clearStorage();

      const firstRender = mantineRenderAdapter({
        ui: (
          <ChatInputWidget
            isStreaming={false}
            onSendMessage={jest.fn(async (): Promise<void> => Promise.resolve())}
            onStopChat={jest.fn()}
          />
        ),
      });

      const firstEditor = screen.getByTestId('CHAT_INPUT');
      fireEvent.paste(firstEditor, { clipboardData: proxy.pasteText({ text: 'A' }) });

      proxy.attachYields({
        attachment: ComposerAttachmentStub({
          attachmentId: '50000000-0000-4000-8000-000000000001',
        }),
      });
      fireEvent.paste(firstEditor, {
        clipboardData: proxy.pasteImage({
          mediaType: 'image/png',
          bytes: new Uint8Array([1, 2, 3, 4]),
        }),
      });
      await waitFor(() => {
        expect(proxy.getThumbnailAttachmentIds()).toStrictEqual([
          '50000000-0000-4000-8000-000000000001',
        ]);
      });

      fireEvent.paste(firstEditor, { clipboardData: proxy.pasteText({ text: 'B' }) });

      firstRender.unmount();

      mantineRenderAdapter({
        ui: (
          <ChatInputWidget
            isStreaming={false}
            onSendMessage={jest.fn(async (): Promise<void> => Promise.resolve())}
            onStopChat={jest.fn()}
          />
        ),
      });

      await waitFor(() => {
        expect(proxy.getThumbnailAttachmentIds()).toStrictEqual([
          '50000000-0000-4000-8000-000000000001',
        ]);
      });

      expect(proxy.getEditorChildren()).toStrictEqual([
        { nodeName: '#text', text: 'A' },
        { nodeName: 'IMG', text: '' },
        { nodeName: '#text', text: 'B' },
      ]);
    });

    it('VALID: {reload after a draft with text "A", an image, and text "B"} => #check-restored-draft-serialises-identically re-saves the identical token string', async () => {
      const proxy = ChatInputWidgetProxy();
      proxy.clearStorage();

      const firstRender = mantineRenderAdapter({
        ui: (
          <ChatInputWidget
            isStreaming={false}
            onSendMessage={jest.fn(async (): Promise<void> => Promise.resolve())}
            onStopChat={jest.fn()}
          />
        ),
      });

      const firstEditor = screen.getByTestId('CHAT_INPUT');
      fireEvent.paste(firstEditor, { clipboardData: proxy.pasteText({ text: 'A' }) });

      proxy.attachYields({
        attachment: ComposerAttachmentStub({
          attachmentId: '50000000-0000-4000-8000-000000000002',
        }),
      });
      fireEvent.paste(firstEditor, {
        clipboardData: proxy.pasteImage({
          mediaType: 'image/png',
          bytes: new Uint8Array([5, 6, 7, 8]),
        }),
      });
      await waitFor(() => {
        expect(proxy.getThumbnailAttachmentIds()).toStrictEqual([
          '50000000-0000-4000-8000-000000000002',
        ]);
      });

      fireEvent.paste(firstEditor, { clipboardData: proxy.pasteText({ text: 'B' }) });

      const draftBeforeReload = localStorage.getItem(chatComposerStatics.draftStorageKey);

      firstRender.unmount();

      mantineRenderAdapter({
        ui: (
          <ChatInputWidget
            isStreaming={false}
            onSendMessage={jest.fn(async (): Promise<void> => Promise.resolve())}
            onStopChat={jest.fn()}
          />
        ),
      });

      await waitFor(() => {
        expect(proxy.getThumbnailAttachmentIds()).toStrictEqual([
          '50000000-0000-4000-8000-000000000002',
        ]);
      });

      // An empty-text paste is a real edit — handlePaste's text/plain branch runs unconditionally —
      // that re-triggers handleContentChanged and re-serialises the CURRENT (post-restore) DOM back
      // to localStorage, without changing the draft's own content. That is what proves the restore
      // actually rebuilt the same segment structure, rather than the assertion merely observing that
      // nothing had touched localStorage since before the reload.
      fireEvent.paste(screen.getByTestId('CHAT_INPUT'), {
        clipboardData: proxy.pasteText({ text: '' }),
      });

      expect(localStorage.getItem(chatComposerStatics.draftStorageKey)).toBe(draftBeforeReload);
    });

    // The design decision restored-draft-sends-like-any-other: the reload path is not finished when
    // the thumbnails come back on screen, it is finished when the restored message SENDS correctly.
    // These two tests are the hand-off from restore into send — the request itself (the HTTP POST)
    // is another session's scope and is deliberately not touched here.
    it('VALID: {reload after a draft with text "A", an image, and text "B", then press Enter} => #check-restored-draft-sends calls onSendMessage once with the same serialised text and the restored image', async () => {
      const proxy = ChatInputWidgetProxy();
      proxy.clearStorage();

      const firstRender = mantineRenderAdapter({
        ui: (
          <ChatInputWidget
            isStreaming={false}
            onSendMessage={jest.fn(async (): Promise<void> => Promise.resolve())}
            onStopChat={jest.fn()}
          />
        ),
      });

      const firstEditor = screen.getByTestId('CHAT_INPUT');
      fireEvent.paste(firstEditor, { clipboardData: proxy.pasteText({ text: 'A' }) });

      const pastedBytes = new Uint8Array([1, 2, 3, 4]);
      proxy.attachYields({
        attachment: ComposerAttachmentStub({
          attachmentId: '80000000-0000-4000-8000-000000000001',
        }),
      });
      fireEvent.paste(firstEditor, {
        clipboardData: proxy.pasteImage({ mediaType: 'image/png', bytes: pastedBytes }),
      });
      await waitFor(() => {
        expect(proxy.getThumbnailAttachmentIds()).toStrictEqual([
          '80000000-0000-4000-8000-000000000001',
        ]);
      });

      fireEvent.paste(firstEditor, { clipboardData: proxy.pasteText({ text: 'B' }) });

      firstRender.unmount();

      const onSendMessage = jest.fn(
        async (_params: OnSendMessageParams): Promise<void> => Promise.resolve(),
      );
      mantineRenderAdapter({
        ui: (
          <ChatInputWidget
            isStreaming={false}
            onSendMessage={onSendMessage}
            onStopChat={jest.fn()}
          />
        ),
      });

      await waitFor(() => {
        expect(proxy.getThumbnailAttachmentIds()).toStrictEqual([
          '80000000-0000-4000-8000-000000000001',
        ]);
      });

      fireEvent.keyDown(screen.getByTestId('CHAT_INPUT'), { key: 'Enter', shiftKey: false });

      // Computed independently of the widget/transformer — the same round-trip
      // file-read-data-url-adapter.test.ts uses to pin FileReader's own base64 output — rather than
      // read back whatever the composer happened to render.
      const expectedBase64 = globalThis.btoa(String.fromCharCode(...pastedBytes));

      expect(onSendMessage).toHaveBeenCalledTimes(1);
      expect(onSendMessage).toHaveBeenCalledWith({
        message: 'A[Pasted Image 1]B',
        images: [PastedImageUploadStub({ mediaType: 'image/png', dataBase64: expectedBase64 })],
        onProgress: expect.any(Function),
      });
    });

    it('VALID: {reload after two pasted images, click SEND} => #check-restored-images-send-byte-identical sends both images with dataBase64 byte-identical to what was pasted, in the same order', async () => {
      const proxy = ChatInputWidgetProxy();
      proxy.clearStorage();

      const firstRender = mantineRenderAdapter({
        ui: (
          <ChatInputWidget
            isStreaming={false}
            onSendMessage={jest.fn(async (): Promise<void> => Promise.resolve())}
            onStopChat={jest.fn()}
          />
        ),
      });

      const firstEditor = screen.getByTestId('CHAT_INPUT');
      fireEvent.paste(firstEditor, { clipboardData: proxy.pasteText({ text: 'A' }) });

      const firstBytes = new Uint8Array([1, 2, 3, 4]);
      proxy.attachYields({
        attachment: ComposerAttachmentStub({
          attachmentId: '90000000-0000-4000-8000-000000000001',
        }),
      });
      fireEvent.paste(firstEditor, {
        clipboardData: proxy.pasteImage({ mediaType: 'image/png', bytes: firstBytes }),
      });
      await waitFor(() => {
        expect(proxy.getThumbnailAttachmentIds()).toStrictEqual([
          '90000000-0000-4000-8000-000000000001',
        ]);
      });

      fireEvent.paste(firstEditor, { clipboardData: proxy.pasteText({ text: 'B' }) });

      const secondBytes = new Uint8Array([5, 6, 7, 8]);
      proxy.attachYields({
        attachment: ComposerAttachmentStub({
          attachmentId: '90000000-0000-4000-8000-000000000002',
        }),
      });
      fireEvent.paste(firstEditor, {
        clipboardData: proxy.pasteImage({ mediaType: 'image/png', bytes: secondBytes }),
      });
      await waitFor(() => {
        expect(proxy.getThumbnailAttachmentIds()).toStrictEqual([
          '90000000-0000-4000-8000-000000000001',
          '90000000-0000-4000-8000-000000000002',
        ]);
      });

      fireEvent.paste(firstEditor, { clipboardData: proxy.pasteText({ text: 'C' }) });

      firstRender.unmount();

      const onSendMessage = jest.fn(
        async (_params: OnSendMessageParams): Promise<void> => Promise.resolve(),
      );
      mantineRenderAdapter({
        ui: (
          <ChatInputWidget
            isStreaming={false}
            onSendMessage={onSendMessage}
            onStopChat={jest.fn()}
          />
        ),
      });

      await waitFor(() => {
        expect(proxy.getThumbnailAttachmentIds()).toStrictEqual([
          '90000000-0000-4000-8000-000000000001',
          '90000000-0000-4000-8000-000000000002',
        ]);
      });

      fireEvent.click(screen.getByTestId('SEND_BUTTON'));

      // Computed independently of the widget/transformer, from the SAME raw bytes each pasteImage
      // call was given — never from proxy.getThumbnailSrcs() or any other read of what the composer
      // itself rendered, which would make the assertion circular.
      const firstDataBase64 = globalThis.btoa(String.fromCharCode(...firstBytes));
      const secondDataBase64 = globalThis.btoa(String.fromCharCode(...secondBytes));
      const expectedImages = [
        PastedImageUploadStub({ mediaType: 'image/png', dataBase64: firstDataBase64 }),
        PastedImageUploadStub({ mediaType: 'image/png', dataBase64: secondDataBase64 }),
      ];

      // toHaveBeenCalledWith does a full deep-equality match on `images` too — same order, same
      // dataBase64 values, no extras — so this one call is the toStrictEqual-equivalent check on the
      // array the max-expects budget for this test has room for.
      expect(onSendMessage).toHaveBeenCalledTimes(1);
      expect(onSendMessage).toHaveBeenCalledWith({
        message: 'A[Pasted Image 1]B[Pasted Image 2]C',
        images: expectedImages,
        onProgress: expect.any(Function),
      });
    });
  });

  describe('an orphaned draft token', () => {
    // Defect 1 half (b): a draft already stored by an older build, or an eviction of the
    // IndexedDB store alone (localStorage untouched), can present a "[Pasted Image N]" token with
    // no backing record. Seeding localStorage directly and leaving the IndexedDB draft store empty
    // reproduces that shape without racing a reload against a paste — the composer must never
    // render the raw token text, which a user could then send as an ordinary word with no image
    // behind it.
    // A bare orphaned token with nothing else in the draft restores to the SAME empty composer a
    // never-restored mount would also show — "drop it" means the two are meant to look identical,
    // so that shape alone cannot prove a restore actually ran. This test instead seeds TWO tokens
    // via a real paste/reload cycle, then evicts only the SECOND image's IndexedDB record before
    // the second mount: the FIRST image restoring for real is the proof the restore path executed;
    // the second token vanishing (not rendered as literal text) is the defect this pins.
    it("EDGE: {two real pasted images, the second one's IndexedDB record evicted before reload} => #check-orphaned-token-dropped-among-real-content the surviving image restores for real and the evicted token leaves no literal text behind", async () => {
      const proxy = ChatInputWidgetProxy();
      proxy.clearStorage();

      const firstRender = mantineRenderAdapter({
        ui: (
          <ChatInputWidget
            isStreaming={false}
            onSendMessage={jest.fn(async (): Promise<void> => Promise.resolve())}
            onStopChat={jest.fn()}
          />
        ),
      });

      const firstEditor = screen.getByTestId('CHAT_INPUT');
      fireEvent.paste(firstEditor, { clipboardData: proxy.pasteText({ text: 'A' }) });

      proxy.attachYields({
        attachment: ComposerAttachmentStub({
          attachmentId: 'e2000000-0000-4000-8000-000000000001',
        }),
      });
      fireEvent.paste(firstEditor, {
        clipboardData: proxy.pasteImage({
          mediaType: 'image/png',
          bytes: new Uint8Array([1, 2, 3, 4]),
        }),
      });
      await waitFor(() => {
        expect(proxy.getThumbnailAttachmentIds()).toStrictEqual([
          'e2000000-0000-4000-8000-000000000001',
        ]);
      });

      fireEvent.paste(firstEditor, { clipboardData: proxy.pasteText({ text: 'B' }) });

      proxy.attachYields({
        attachment: ComposerAttachmentStub({
          attachmentId: 'e2000000-0000-4000-8000-000000000002',
        }),
      });
      fireEvent.paste(firstEditor, {
        clipboardData: proxy.pasteImage({
          mediaType: 'image/png',
          bytes: new Uint8Array([5, 6, 7, 8]),
        }),
      });
      await waitFor(() => {
        expect(proxy.getThumbnailAttachmentIds()).toStrictEqual([
          'e2000000-0000-4000-8000-000000000001',
          'e2000000-0000-4000-8000-000000000002',
        ]);
      });

      // Unchanged-attachments text paste — takes the synchronous write path, so the draft text
      // (both tokens) is guaranteed fully persisted to localStorage by the time this returns.
      fireEvent.paste(firstEditor, { clipboardData: proxy.pasteText({ text: 'C' }) });

      // Simulates the second half of defect 1: an eviction of the IndexedDB store that leaves
      // localStorage untouched. Replaces the store with only the FIRST image's already-real
      // record — the same `draftImagesSaveBroker` call the "rejection recovers the composer"
      // tests above use to drive the store directly.
      const storedBeforeEviction = await proxy.getStoredDraftImages();
      const definedBeforeEviction = storedBeforeEviction.filter(
        (attachment): attachment is ReturnType<typeof ComposerAttachmentStub> =>
          attachment !== undefined,
      );
      const survivingRecords = definedBeforeEviction.filter(
        (attachment) => attachment.attachmentId === 'e2000000-0000-4000-8000-000000000001',
      );

      expect(survivingRecords.map((attachment) => attachment.attachmentId)).toStrictEqual([
        'e2000000-0000-4000-8000-000000000001',
      ]);

      await draftImagesSaveBroker({ attachments: survivingRecords });

      firstRender.unmount();

      mantineRenderAdapter({
        ui: (
          <ChatInputWidget
            isStreaming={false}
            onSendMessage={jest.fn(async (): Promise<void> => Promise.resolve())}
            onStopChat={jest.fn()}
          />
        ),
      });

      // The surviving image restores for real — the proof this is an actual restore, not a
      // composer that never ran one.
      await waitFor(() => {
        expect(proxy.getThumbnailAttachmentIds()).toStrictEqual([
          'e2000000-0000-4000-8000-000000000001',
        ]);
      });

      // The evicted token is gone, not rendered as literal text — the text on both sides of it
      // survives.
      expect(proxy.getEditorText()).toBe('ABC');
    });

    // Same seed, with real surrounding text — proves the orphaned token disappears on its own
    // while its neighbours survive, rather than the whole draft being discarded.
    it('EDGE: {localStorage holds "A[Pasted Image 1]B", IndexedDB draft store is empty} => #check-orphaned-token-drops-alone the surrounding text restores and the token is gone', async () => {
      const proxy = ChatInputWidgetProxy();
      proxy.clearStorage();
      localStorage.setItem(chatComposerStatics.draftStorageKey, 'A[Pasted Image 1]B');

      mantineRenderAdapter({
        ui: (
          <ChatInputWidget
            isStreaming={false}
            onSendMessage={jest.fn(async (): Promise<void> => Promise.resolve())}
            onStopChat={jest.fn()}
          />
        ),
      });

      await waitFor(() => {
        expect(proxy.getEditorText()).toBe('AB');
      });

      expect(proxy.getThumbnailSrcs()).toStrictEqual([]);
    });
  });

  describe('durable write ordering', () => {
    // Defect 1 half (a) — the ORDER test. A reload racing a paste is inherently flaky (the
    // walker's own repro reproduced 1 of 3 tries), so this proves the ordering guarantee directly
    // instead of racing it: the localStorage token for a piece of content is never written unless
    // the IndexedDB bytes behind it committed first. Forcing the IndexedDB write to fail is what
    // makes that observable deterministically — if the token were written independently of (or
    // before) the bytes, it would still show up here even though the byte write never landed.
    it('ERROR: {paste an image while the IndexedDB draft store is unavailable} => #check-bytes-before-token localStorage never gains the placeholder token for that paste', async () => {
      const proxy = ChatInputWidgetProxy();
      proxy.clearStorage();
      proxy.indexedDbUnavailable({ error: new Error('indexedDB unavailable') });

      mantineRenderAdapter({
        ui: (
          <ChatInputWidget
            isStreaming={false}
            onSendMessage={jest.fn(async (): Promise<void> => Promise.resolve())}
            onStopChat={jest.fn()}
          />
        ),
      });

      const editor = screen.getByTestId('CHAT_INPUT');
      proxy.attachYields({
        attachment: ComposerAttachmentStub({
          attachmentId: 'd2000000-0000-4000-8000-000000000001',
        }),
      });
      fireEvent.paste(editor, {
        clipboardData: proxy.pasteImage({
          mediaType: 'image/png',
          bytes: new Uint8Array([1, 2, 3, 4]),
        }),
      });

      // The paste itself is not held up by the broken store — the thumbnail still inserts.
      await waitFor(() => {
        expect(proxy.getThumbnailAttachmentIds()).toStrictEqual([
          'd2000000-0000-4000-8000-000000000001',
        ]);
      });

      // Gives the failed IndexedDB write's rejection every chance to be handled (it is — logged,
      // not thrown) before asserting on localStorage's own, separately-persisted state.
      await new Promise((resolve) => {
        setTimeout(resolve, 0);
      });

      expect(localStorage.getItem(chatComposerStatics.draftStorageKey)).toBe(null);
    });
  });

  describe('the overlay', () => {
    it('VALID: {click a thumbnail still in the composer} => #check-composer-click-opens-overlay opens the overlay on that same image', async () => {
      const proxy = ChatInputWidgetProxy();
      proxy.clearStorage();

      mantineRenderAdapter({
        ui: (
          <ChatInputWidget
            isStreaming={false}
            onSendMessage={jest.fn(async (): Promise<void> => Promise.resolve())}
            onStopChat={jest.fn()}
          />
        ),
      });

      const editor = screen.getByTestId('CHAT_INPUT');
      proxy.attachYields({
        attachment: ComposerAttachmentStub({
          attachmentId: '60000000-0000-4000-8000-000000000001',
        }),
      });
      fireEvent.paste(editor, {
        clipboardData: proxy.pasteImage({
          mediaType: 'image/png',
          bytes: new Uint8Array([1, 2, 3, 4]),
        }),
      });
      await waitFor(() => {
        expect(proxy.getThumbnailAttachmentIds()).toStrictEqual([
          '60000000-0000-4000-8000-000000000001',
        ]);
      });

      const [clickedSrc] = proxy.getThumbnailSrcs();
      fireEvent.click(screen.getByTestId(chatComposerStatics.thumbnail.testId));

      // Mantine's Modal mounts its portal content a tick after the opened prop flips true (its own
      // open transition), unlike image-overlay-widget.test.tsx's cases, which all start mounted with
      // opened={true} and so never observe that delay.
      await waitFor(() => {
        expect(proxy.hasOverlay()).toBe(true);
      });

      expect(proxy.getOverlayImageSrc()).toBe(clickedSrc);
    });
  });

  describe('typing plain text with no image in the composer', () => {
    // Regression coverage: the rewrite to a contenteditable div dropped the textarea's onChange —
    // handleContentChanged used to run only from the paste path, the delete path, and the
    // intercepted-insertText path (which fires only while a thumbnail is already present), so a
    // plain keystroke into an image-free composer never reached it at all. These four tests drive
    // the editor the way a real browser does — mutate the DOM, then fire the native `input` event
    // the browser emits afterward — rather than through `beforeinput`, which this widget
    // deliberately does not intercept when no thumbnail is present.
    it('VALID: {typed text, no image in composer} => #check-typing-writes-draft-to-localstorage-regression writes the typed text to localStorage', () => {
      const proxy = ChatInputWidgetProxy();
      proxy.clearStorage();

      mantineRenderAdapter({
        ui: (
          <ChatInputWidget
            isStreaming={false}
            onSendMessage={jest.fn(async (): Promise<void> => Promise.resolve())}
            onStopChat={jest.fn()}
          />
        ),
      });

      const editor = screen.getByTestId('CHAT_INPUT');
      editor.textContent = 'hand typed text';
      fireEvent.input(editor);

      expect(localStorage.getItem(chatComposerStatics.draftStorageKey)).toBe('hand typed text');
    });

    it('VALID: {typed text, no image in composer} => #check-typing-clears-placeholder removes the CHAT_INPUT_PLACEHOLDER element', () => {
      const proxy = ChatInputWidgetProxy();
      proxy.clearStorage();

      mantineRenderAdapter({
        ui: (
          <ChatInputWidget
            isStreaming={false}
            onSendMessage={jest.fn(async (): Promise<void> => Promise.resolve())}
            onStopChat={jest.fn()}
          />
        ),
      });

      const editor = screen.getByTestId('CHAT_INPUT');
      editor.textContent = 'hand typed text';
      fireEvent.input(editor);

      expect(screen.queryByTestId('CHAT_INPUT_PLACEHOLDER')).toBe(null);
    });

    it('VALID: {typed text, no image in composer} => #check-typing-does-not-rewrite-draft-images leaves the IndexedDB draft store unchanged', async () => {
      const proxy = ChatInputWidgetProxy();
      proxy.clearStorage();

      mantineRenderAdapter({
        ui: (
          <ChatInputWidget
            isStreaming={false}
            onSendMessage={jest.fn(async (): Promise<void> => Promise.resolve())}
            onStopChat={jest.fn()}
          />
        ),
      });

      const editor = screen.getByTestId('CHAT_INPUT');
      editor.textContent = 'hand typed text';
      fireEvent.input(editor);

      // Flushes any microtask/task-queue chain a (buggy, unconditional) draftImagesSaveBroker call
      // would already have scheduled by now — handleContentChanged's gate returns synchronously
      // when the attachment id list is unchanged, so there is nothing to await on the CORRECT path;
      // this only exists to give a regressed unconditional write a real chance to land before the
      // read below, rather than reading the store back before a scheduled write could complete.
      await new Promise((resolve) => {
        setTimeout(resolve, 0);
      });

      await expect(proxy.getStoredDraftImages()).resolves.toStrictEqual([]);
    });

    it('VALID: {paste an image into an empty composer} => #check-paste-still-writes-draft-images writes the image to the IndexedDB draft store', async () => {
      const proxy = ChatInputWidgetProxy();
      proxy.clearStorage();

      mantineRenderAdapter({
        ui: (
          <ChatInputWidget
            isStreaming={false}
            onSendMessage={jest.fn(async (): Promise<void> => Promise.resolve())}
            onStopChat={jest.fn()}
          />
        ),
      });

      const editor = screen.getByTestId('CHAT_INPUT');
      const pastedBytes = new Uint8Array([1, 2, 3, 4]);
      proxy.attachYields({
        attachment: ComposerAttachmentStub({
          attachmentId: 'a1000000-0000-4000-8000-000000000001',
        }),
      });
      fireEvent.paste(editor, {
        clipboardData: proxy.pasteImage({ mediaType: 'image/png', bytes: pastedBytes }),
      });

      await waitFor(() => {
        expect(proxy.getThumbnailAttachmentIds()).toStrictEqual([
          'a1000000-0000-4000-8000-000000000001',
        ]);
      });

      // pastedImageAttachBroker runs for real (only crypto.randomUUID and the downscale ladder's
      // measured size are mocked, via attachYields), so the stored draft's bytes come from the
      // REAL pasted Uint8Array read through fileReadDataUrlAdapter's FileReader, never from
      // ComposerAttachmentStub's own default dataUrl — computed independently here the same way
      // the reload-restore tests above do, rather than read back off the composer's own thumbnail.
      // widthPx/heightPx stay at ComposerAttachmentStub's own defaults because attachYields never
      // overrode them, and the downscale ladder's proxy stages exactly those as the measured size.
      const expectedDataBase64 = globalThis.btoa(String.fromCharCode(...pastedBytes));
      const expectedByteLength = base64ByteLengthTransformer({ dataBase64: expectedDataBase64 });
      const expectedAttachments = [
        ComposerAttachmentStub({
          attachmentId: 'a1000000-0000-4000-8000-000000000001',
          dataUrl: `data:image/png;base64,${expectedDataBase64}`,
          byteLength: expectedByteLength,
        }),
      ];

      await waitFor(async () => {
        await expect(proxy.getStoredDraftImages()).resolves.toStrictEqual(expectedAttachments);
      });

      await expect(proxy.getStoredDraftImages()).resolves.toStrictEqual(expectedAttachments);
    });
  });

  describe('the caret after a delete', () => {
    it('VALID: {backward delete removes a thumbnail between "a" and "b", then typing "x"} => the caret lands where the thumbnail was, giving "axb"', async () => {
      const proxy = ChatInputWidgetProxy();
      proxy.clearStorage();

      mantineRenderAdapter({
        ui: (
          <ChatInputWidget
            isStreaming={false}
            onSendMessage={jest.fn(async (): Promise<void> => Promise.resolve())}
            onStopChat={jest.fn()}
          />
        ),
      });

      const editor = screen.getByTestId('CHAT_INPUT');
      fireEvent.paste(editor, { clipboardData: proxy.pasteText({ text: 'a' }) });

      proxy.attachYields({
        attachment: ComposerAttachmentStub({
          attachmentId: '70000000-0000-4000-8000-000000000001',
        }),
      });
      fireEvent.paste(editor, {
        clipboardData: proxy.pasteImage({
          mediaType: 'image/png',
          bytes: new Uint8Array([1, 2, 3, 4]),
        }),
      });
      await waitFor(() => {
        expect(proxy.getThumbnailAttachmentIds()).toStrictEqual([
          '70000000-0000-4000-8000-000000000001',
        ]);
      });

      fireEvent.paste(editor, { clipboardData: proxy.pasteText({ text: 'b' }) });

      // Caret directly after the thumbnail — the same setStart(editor, 2) technique
      // dom-composer-delete-thumbnail-adapter.test.ts uses for its own "surrounding text survives"
      // case — so the backward delete below targets the thumbnail, not a character of "b".
      const selection = document.getSelection();
      const range = document.createRange();
      range.setStart(editor, 2);
      range.collapse(true);
      selection?.removeAllRanges();
      selection?.addRange(range);

      editor.dispatchEvent(
        new InputEvent('beforeinput', {
          inputType: 'deleteContentBackward',
          bubbles: true,
          cancelable: true,
        }),
      );

      fireEvent.paste(editor, { clipboardData: proxy.pasteText({ text: 'x' }) });

      expect(editor.textContent).toBe('axb');
    });
  });

  describe('sending is a settled transaction — locking', () => {
    it('VALID: {plain Enter with text typed} => #check-one-enter-one-send issues exactly one POST, not two', () => {
      const proxy = ChatInputWidgetProxy();
      proxy.clearStorage();
      const onSendMessage = jest.fn(async (): Promise<void> => Promise.resolve());

      mantineRenderAdapter({
        ui: (
          <ChatInputWidget
            isStreaming={false}
            onSendMessage={onSendMessage}
            onStopChat={jest.fn()}
          />
        ),
      });

      const editor = screen.getByTestId('CHAT_INPUT');
      fireEvent.paste(editor, { clipboardData: proxy.pasteText({ text: 'hello' }) });
      fireEvent.keyDown(editor, { key: 'Enter', shiftKey: false });

      const callCount = onSendMessage.mock.calls.length;

      expect(callCount).toBe(1);
    });

    it('EDGE: {a second Enter fired while the first send is still in flight} => #check-one-enter-one-send leaves the call count at one', () => {
      const proxy = ChatInputWidgetProxy();
      proxy.clearStorage();
      const onSendMessage = jest.fn(async (): Promise<void> => new Promise<void>(() => {}));

      mantineRenderAdapter({
        ui: (
          <ChatInputWidget
            isStreaming={false}
            onSendMessage={onSendMessage}
            onStopChat={jest.fn()}
          />
        ),
      });

      const editor = screen.getByTestId('CHAT_INPUT');
      fireEvent.paste(editor, { clipboardData: proxy.pasteText({ text: 'hello' }) });
      fireEvent.keyDown(editor, { key: 'Enter', shiftKey: false });
      fireEvent.keyDown(editor, { key: 'Enter', shiftKey: false });

      const callCount = onSendMessage.mock.calls.length;

      expect(callCount).toBe(1);
    });

    it('VALID: {POST still in flight} => #check-composer-locked-in-flight CHAT_INPUT is not editable and SEND_BUTTON is disabled', () => {
      const proxy = ChatInputWidgetProxy();
      proxy.clearStorage();
      const onSendMessage = jest.fn(async (): Promise<void> => new Promise<void>(() => {}));

      mantineRenderAdapter({
        ui: (
          <ChatInputWidget
            isStreaming={false}
            onSendMessage={onSendMessage}
            onStopChat={jest.fn()}
          />
        ),
      });

      const editor = screen.getByTestId('CHAT_INPUT');
      fireEvent.paste(editor, { clipboardData: proxy.pasteText({ text: 'hello' }) });
      fireEvent.keyDown(editor, { key: 'Enter', shiftKey: false });

      expect(proxy.isEditorEditable()).toBe(false);
      expect(proxy.isSendButtonDisabled()).toBe(true);
    });
  });

  describe('sending is a settled transaction — shift+enter', () => {
    it('VALID: {Shift+Enter with text already typed} => #check-shift-enter-adds-newline inserts a newline into the composer content', () => {
      const proxy = ChatInputWidgetProxy();
      proxy.clearStorage();

      mantineRenderAdapter({
        ui: (
          <ChatInputWidget
            isStreaming={false}
            onSendMessage={jest.fn(async (): Promise<void> => Promise.resolve())}
            onStopChat={jest.fn()}
          />
        ),
      });

      const editor = screen.getByTestId('CHAT_INPUT');
      fireEvent.paste(editor, { clipboardData: proxy.pasteText({ text: 'hello' }) });
      fireEvent.keyDown(editor, { key: 'Enter', shiftKey: true });

      expect(proxy.getEditorText()).toBe('hello\n');
    });

    it('VALID: {Shift+Enter with text already typed} => #check-shift-enter-sends-nothing issues zero HTTP requests', () => {
      const proxy = ChatInputWidgetProxy();
      proxy.clearStorage();
      const onSendMessage = jest.fn(async (): Promise<void> => Promise.resolve());

      mantineRenderAdapter({
        ui: (
          <ChatInputWidget
            isStreaming={false}
            onSendMessage={onSendMessage}
            onStopChat={jest.fn()}
          />
        ),
      });

      const editor = screen.getByTestId('CHAT_INPUT');
      fireEvent.paste(editor, { clipboardData: proxy.pasteText({ text: 'hello' }) });
      fireEvent.keyDown(editor, { key: 'Enter', shiftKey: true });

      expect(onSendMessage.mock.calls).toStrictEqual([]);
    });
  });

  describe('sending is a settled transaction — attachment ordering', () => {
    it('VALID: {paste image A, type text, paste image B, press Enter} => #check-attachments-in-paste-order the images array reaching onSendMessage is ordered first-pasted first', async () => {
      const proxy = ChatInputWidgetProxy();
      proxy.clearStorage();
      const onSendMessage = jest.fn(
        async (_params: OnSendMessageParams): Promise<void> => Promise.resolve(),
      );

      mantineRenderAdapter({
        ui: (
          <ChatInputWidget
            isStreaming={false}
            onSendMessage={onSendMessage}
            onStopChat={jest.fn()}
          />
        ),
      });

      const editor = screen.getByTestId('CHAT_INPUT');
      const firstBytes = new Uint8Array([1, 2, 3, 4]);
      proxy.attachYields({
        attachment: ComposerAttachmentStub({
          attachmentId: 'b1000000-0000-4000-8000-000000000001',
        }),
      });
      fireEvent.paste(editor, {
        clipboardData: proxy.pasteImage({ mediaType: 'image/png', bytes: firstBytes }),
      });
      await waitFor(() => {
        expect(proxy.getThumbnailAttachmentIds()).toStrictEqual([
          'b1000000-0000-4000-8000-000000000001',
        ]);
      });

      fireEvent.paste(editor, { clipboardData: proxy.pasteText({ text: 'middle' }) });

      const secondBytes = new Uint8Array([5, 6, 7, 8]);
      proxy.attachYields({
        attachment: ComposerAttachmentStub({
          attachmentId: 'b1000000-0000-4000-8000-000000000002',
        }),
      });
      fireEvent.paste(editor, {
        clipboardData: proxy.pasteImage({ mediaType: 'image/png', bytes: secondBytes }),
      });
      await waitFor(() => {
        expect(proxy.getThumbnailAttachmentIds()).toStrictEqual([
          'b1000000-0000-4000-8000-000000000001',
          'b1000000-0000-4000-8000-000000000002',
        ]);
      });

      fireEvent.keyDown(editor, { key: 'Enter', shiftKey: false });

      const firstDataBase64 = globalThis.btoa(String.fromCharCode(...firstBytes));
      const secondDataBase64 = globalThis.btoa(String.fromCharCode(...secondBytes));
      const expectedImages = [
        PastedImageUploadStub({ mediaType: 'image/png', dataBase64: firstDataBase64 }),
        PastedImageUploadStub({ mediaType: 'image/png', dataBase64: secondDataBase64 }),
      ];

      const actualImages = onSendMessage.mock.calls.at(0)?.[0].images;

      expect(actualImages).toStrictEqual(expectedImages);
    });
  });

  describe('sending is a settled transaction — upload progress', () => {
    it('VALID: {send carries one image} => #check-progress-bar-shown shows an upload progress bar beneath the composer', async () => {
      const proxy = ChatInputWidgetProxy();
      proxy.clearStorage();
      const onSendMessage = jest.fn(async (): Promise<void> => new Promise<void>(() => {}));

      mantineRenderAdapter({
        ui: (
          <ChatInputWidget
            isStreaming={false}
            onSendMessage={onSendMessage}
            onStopChat={jest.fn()}
          />
        ),
      });

      const editor = screen.getByTestId('CHAT_INPUT');
      proxy.attachYields({
        attachment: ComposerAttachmentStub({
          attachmentId: 'a2000000-0000-4000-8000-000000000001',
        }),
      });
      fireEvent.paste(editor, {
        clipboardData: proxy.pasteImage({
          mediaType: 'image/png',
          bytes: new Uint8Array([1, 2, 3, 4]),
        }),
      });
      await waitFor(() => {
        expect(proxy.getThumbnailAttachmentIds()).toStrictEqual([
          'a2000000-0000-4000-8000-000000000001',
        ]);
      });

      fireEvent.keyDown(editor, { key: 'Enter', shiftKey: false });

      expect(proxy.hasProgressBar()).toBe(true);
    });

    it('VALID: {text-only send in flight} => #check-progress-bar-shown shows no progress bar', () => {
      const proxy = ChatInputWidgetProxy();
      proxy.clearStorage();
      // A fake that actually EXERCISES whatever onProgress it was handed, rather than one that
      // silently ignores it — a fake that never calls onProgress would pass this assertion
      // whether or not the widget still (incorrectly) hands one to a text-only send.
      const onSendMessage = jest.fn(async (params: OnSendMessageParams): Promise<void> => {
        params.onProgress?.({
          bytesSent: ByteLengthStub({ value: 512 }),
          bytesTotal: ByteLengthStub({ value: 1024 }),
        });
        return new Promise<void>(() => {});
      });

      mantineRenderAdapter({
        ui: (
          <ChatInputWidget
            isStreaming={false}
            onSendMessage={onSendMessage}
            onStopChat={jest.fn()}
          />
        ),
      });

      const editor = screen.getByTestId('CHAT_INPUT');
      fireEvent.paste(editor, { clipboardData: proxy.pasteText({ text: 'hello' }) });
      fireEvent.keyDown(editor, { key: 'Enter', shiftKey: false });

      expect(proxy.hasProgressBar()).toBe(false);

      const capturedParams = onSendMessage.mock.calls.at(0)?.[0];

      expect(capturedParams).toStrictEqual({ message: 'hello' });
    });

    it('VALID: {onProgress fires 512/1024 then 1024/1024 before the response resolves} => #check-progress-reaches-complete the bar reads 50 then 100 while still pending', async () => {
      const proxy = ChatInputWidgetProxy();
      proxy.clearStorage();
      // The mock sequences its own two progress ticks around a real microtask boundary, rather
      // than a test-captured onProgress reference — the first tick lands synchronously inside the
      // same `act()` fireEvent.keyDown already opens, and the second lands after a genuine `await`,
      // which is what proves 50 was on screen BEFORE 100 rather than only after the whole send
      // settles.
      const onSendMessage = jest.fn(async ({ onProgress }: OnSendMessageParams): Promise<void> => {
        onProgress?.({
          bytesSent: ByteLengthStub({ value: 512 }),
          bytesTotal: ByteLengthStub({ value: 1024 }),
        });
        await Promise.resolve();
        onProgress?.({
          bytesSent: ByteLengthStub({ value: 1024 }),
          bytesTotal: ByteLengthStub({ value: 1024 }),
        });
        return new Promise<void>(() => {});
      });

      mantineRenderAdapter({
        ui: (
          <ChatInputWidget
            isStreaming={false}
            onSendMessage={onSendMessage}
            onStopChat={jest.fn()}
          />
        ),
      });

      const editor = screen.getByTestId('CHAT_INPUT');
      proxy.attachYields({
        attachment: ComposerAttachmentStub({
          attachmentId: 'a3000000-0000-4000-8000-000000000001',
        }),
      });
      fireEvent.paste(editor, {
        clipboardData: proxy.pasteImage({
          mediaType: 'image/png',
          bytes: new Uint8Array([1, 2, 3, 4]),
        }),
      });
      await waitFor(() => {
        expect(proxy.getThumbnailAttachmentIds()).toStrictEqual([
          'a3000000-0000-4000-8000-000000000001',
        ]);
      });

      fireEvent.keyDown(editor, { key: 'Enter', shiftKey: false });

      expect(proxy.getProgressPercent()).toBe(50);

      await waitFor(() => {
        expect(proxy.getProgressPercent()).toBe(100);
      });

      expect(proxy.getProgressPercent()).toBe(100);
    });
  });

  describe('rejection recovers the composer', () => {
    it('ERROR: {server rejects with a 409 and "Quest is not accepting follow-ups"} => #check-server-error-text-in-toast the toast shows that exact sentence', async () => {
      const proxy = ChatInputWidgetProxy();
      proxy.clearStorage();
      const onSendMessage = jest.fn(
        async (): Promise<void> => Promise.reject(new Error('Quest is not accepting follow-ups')),
      );

      mantineRenderAdapter({
        ui: (
          <ChatInputWidget
            isStreaming={false}
            onSendMessage={onSendMessage}
            onStopChat={jest.fn()}
          />
        ),
      });

      const editor = screen.getByTestId('CHAT_INPUT');
      fireEvent.paste(editor, { clipboardData: proxy.pasteText({ text: 'hello' }) });
      fireEvent.keyDown(editor, { key: 'Enter', shiftKey: false });

      await waitFor(() => {
        expect(proxy.getShownToast()).toStrictEqual({
          message: 'Quest is not accepting follow-ups',
          color: chatComposerStatics.toastColor,
        });
      });

      expect(proxy.getShownToast()).toStrictEqual({
        message: 'Quest is not accepting follow-ups',
        color: chatComposerStatics.toastColor,
      });
    });

    it('ERROR: {server rejects with a 500 and "Could not save pasted image"} => #check-write-failure-toast-text the toast shows that exact sentence rather than a generic failure message', async () => {
      const proxy = ChatInputWidgetProxy();
      proxy.clearStorage();
      const onSendMessage = jest.fn(
        async (): Promise<void> => Promise.reject(new Error('Could not save pasted image')),
      );

      mantineRenderAdapter({
        ui: (
          <ChatInputWidget
            isStreaming={false}
            onSendMessage={onSendMessage}
            onStopChat={jest.fn()}
          />
        ),
      });

      const editor = screen.getByTestId('CHAT_INPUT');
      fireEvent.paste(editor, { clipboardData: proxy.pasteText({ text: 'hello' }) });
      fireEvent.keyDown(editor, { key: 'Enter', shiftKey: false });

      await waitFor(() => {
        expect(proxy.getShownToast()).toStrictEqual({
          message: 'Could not save pasted image',
          color: chatComposerStatics.toastColor,
        });
      });

      expect(proxy.getShownToast()).toStrictEqual({
        message: 'Could not save pasted image',
        color: chatComposerStatics.toastColor,
      });
    });

    it('ERROR: {send rejected with two images attached} => #check-composer-reenabled-intact CHAT_INPUT is editable again and still holds its text and both thumbnails', async () => {
      const proxy = ChatInputWidgetProxy();
      proxy.clearStorage();
      const onSendMessage = jest.fn(
        async (): Promise<void> => Promise.reject(new Error('Quest is not accepting follow-ups')),
      );

      mantineRenderAdapter({
        ui: (
          <ChatInputWidget
            isStreaming={false}
            onSendMessage={onSendMessage}
            onStopChat={jest.fn()}
          />
        ),
      });

      const editor = screen.getByTestId('CHAT_INPUT');
      fireEvent.paste(editor, { clipboardData: proxy.pasteText({ text: 'hello world' }) });

      proxy.attachYields({
        attachment: ComposerAttachmentStub({
          attachmentId: 'c1000000-0000-4000-8000-000000000001',
        }),
      });
      fireEvent.paste(editor, {
        clipboardData: proxy.pasteImage({
          mediaType: 'image/png',
          bytes: new Uint8Array([1, 2, 3, 4]),
        }),
      });
      await waitFor(() => {
        expect(proxy.getThumbnailAttachmentIds()).toStrictEqual([
          'c1000000-0000-4000-8000-000000000001',
        ]);
      });

      proxy.attachYields({
        attachment: ComposerAttachmentStub({
          attachmentId: 'c1000000-0000-4000-8000-000000000002',
        }),
      });
      fireEvent.paste(editor, {
        clipboardData: proxy.pasteImage({
          mediaType: 'image/png',
          bytes: new Uint8Array([5, 6, 7, 8]),
        }),
      });
      await waitFor(() => {
        expect(proxy.getThumbnailAttachmentIds()).toStrictEqual([
          'c1000000-0000-4000-8000-000000000001',
          'c1000000-0000-4000-8000-000000000002',
        ]);
      });

      fireEvent.keyDown(editor, { key: 'Enter', shiftKey: false });

      await waitFor(() => {
        expect(proxy.isEditorEditable()).toBe(true);
      });

      expect(proxy.getEditorText()).toBe('hello world');
      expect(proxy.getThumbnailAttachmentIds()).toStrictEqual([
        'c1000000-0000-4000-8000-000000000001',
        'c1000000-0000-4000-8000-000000000002',
      ]);
    });

    it('ERROR: {a draft already saved before the rejected send} => #check-draft-survives-rejection both the localStorage key and its IndexedDB records still exist after the rejection', async () => {
      const proxy = ChatInputWidgetProxy();
      proxy.clearStorage();
      const onSendMessage = jest.fn(
        async (): Promise<void> => Promise.reject(new Error('Could not save pasted image')),
      );

      mantineRenderAdapter({
        ui: (
          <ChatInputWidget
            isStreaming={false}
            onSendMessage={onSendMessage}
            onStopChat={jest.fn()}
          />
        ),
      });

      const editor = screen.getByTestId('CHAT_INPUT');
      fireEvent.paste(editor, { clipboardData: proxy.pasteText({ text: 'draft text' }) });

      const pastedBytes = new Uint8Array([1, 2, 3, 4]);
      proxy.attachYields({
        attachment: ComposerAttachmentStub({
          attachmentId: 'd1000000-0000-4000-8000-000000000001',
        }),
      });
      fireEvent.paste(editor, {
        clipboardData: proxy.pasteImage({ mediaType: 'image/png', bytes: pastedBytes }),
      });
      await waitFor(() => {
        expect(proxy.getThumbnailAttachmentIds()).toStrictEqual([
          'd1000000-0000-4000-8000-000000000001',
        ]);
      });

      const draftBeforeSend = localStorage.getItem(chatComposerStatics.draftStorageKey);

      fireEvent.keyDown(editor, { key: 'Enter', shiftKey: false });

      await waitFor(() => {
        expect(proxy.isEditorEditable()).toBe(true);
      });

      expect(localStorage.getItem(chatComposerStatics.draftStorageKey)).toBe(draftBeforeSend);

      const expectedDataBase64 = globalThis.btoa(String.fromCharCode(...pastedBytes));
      const expectedByteLength = base64ByteLengthTransformer({ dataBase64: expectedDataBase64 });

      await expect(proxy.getStoredDraftImages()).resolves.toStrictEqual([
        ComposerAttachmentStub({
          attachmentId: 'd1000000-0000-4000-8000-000000000001',
          dataUrl: `data:image/png;base64,${expectedDataBase64}`,
          byteLength: expectedByteLength,
        }),
      ]);
    });

    it('ERROR: {rejection with the attachment id list unchanged since the last write} => #check-rejection-writes-draft-when-none-saved rewrites the draft anyway', async () => {
      const proxy = ChatInputWidgetProxy();
      proxy.clearStorage();
      const onSendMessage = jest.fn(
        async (): Promise<void> => Promise.reject(new Error('Quest is not accepting follow-ups')),
      );

      mantineRenderAdapter({
        ui: (
          <ChatInputWidget
            isStreaming={false}
            onSendMessage={onSendMessage}
            onStopChat={jest.fn()}
          />
        ),
      });

      const editor = screen.getByTestId('CHAT_INPUT');
      const pastedBytes = new Uint8Array([9, 8, 7, 6]);
      proxy.attachYields({
        attachment: ComposerAttachmentStub({
          attachmentId: 'e1000000-0000-4000-8000-000000000001',
        }),
      });
      fireEvent.paste(editor, {
        clipboardData: proxy.pasteImage({ mediaType: 'image/png', bytes: pastedBytes }),
      });
      await waitFor(() => {
        expect(proxy.getThumbnailAttachmentIds()).toStrictEqual([
          'e1000000-0000-4000-8000-000000000001',
        ]);
      });

      // Simulates a draft no longer present in storage while the widget's own bookkeeping still
      // believes this exact attachment id list is what it last saved — the scenario `force` exists
      // for. Without `force: true` on the rejection path, handleContentChanged would see the
      // (unchanged) id list and skip the write, leaving this store empty.
      await draftImagesSaveBroker({ attachments: [] });

      fireEvent.keyDown(editor, { key: 'Enter', shiftKey: false });

      await waitFor(() => {
        expect(proxy.isEditorEditable()).toBe(true);
      });

      const expectedDataBase64 = globalThis.btoa(String.fromCharCode(...pastedBytes));
      const expectedByteLength = base64ByteLengthTransformer({ dataBase64: expectedDataBase64 });

      await expect(proxy.getStoredDraftImages()).resolves.toStrictEqual([
        ComposerAttachmentStub({
          attachmentId: 'e1000000-0000-4000-8000-000000000001',
          dataUrl: `data:image/png;base64,${expectedDataBase64}`,
          byteLength: expectedByteLength,
        }),
      ]);
    });

    it('ERROR: {rejected send that carried one image} => #check-progress-bar-gone-on-rejection the upload progress bar is no longer in the document', async () => {
      const proxy = ChatInputWidgetProxy();
      proxy.clearStorage();
      const onSendMessage = jest.fn(
        async (): Promise<void> => Promise.reject(new Error('Quest is not accepting follow-ups')),
      );

      mantineRenderAdapter({
        ui: (
          <ChatInputWidget
            isStreaming={false}
            onSendMessage={onSendMessage}
            onStopChat={jest.fn()}
          />
        ),
      });

      const editor = screen.getByTestId('CHAT_INPUT');
      proxy.attachYields({
        attachment: ComposerAttachmentStub({
          attachmentId: 'f2000000-0000-4000-8000-000000000001',
        }),
      });
      fireEvent.paste(editor, {
        clipboardData: proxy.pasteImage({
          mediaType: 'image/png',
          bytes: new Uint8Array([1, 2, 3, 4]),
        }),
      });
      await waitFor(() => {
        expect(proxy.getThumbnailAttachmentIds()).toStrictEqual([
          'f2000000-0000-4000-8000-000000000001',
        ]);
      });

      fireEvent.keyDown(editor, { key: 'Enter', shiftKey: false });

      await waitFor(() => {
        expect(proxy.hasProgressBar()).toBe(false);
      });

      expect(proxy.hasProgressBar()).toBe(false);
    });
  });

  describe('acceptance clears the composer', () => {
    it('VALID: {accepted send with text and one image} => #check-composer-emptied the composer holds no text and zero thumbnails after acceptance', async () => {
      const proxy = ChatInputWidgetProxy();
      proxy.clearStorage();
      const onSendMessage = jest.fn(async (): Promise<void> => Promise.resolve());

      mantineRenderAdapter({
        ui: (
          <ChatInputWidget
            isStreaming={false}
            onSendMessage={onSendMessage}
            onStopChat={jest.fn()}
          />
        ),
      });

      const editor = screen.getByTestId('CHAT_INPUT');
      fireEvent.paste(editor, { clipboardData: proxy.pasteText({ text: 'hello world' }) });

      proxy.attachYields({
        attachment: ComposerAttachmentStub({
          attachmentId: 'a4000000-0000-4000-8000-000000000001',
        }),
      });
      fireEvent.paste(editor, {
        clipboardData: proxy.pasteImage({
          mediaType: 'image/png',
          bytes: new Uint8Array([1, 2, 3, 4]),
        }),
      });
      await waitFor(() => {
        expect(proxy.getThumbnailAttachmentIds()).toStrictEqual([
          'a4000000-0000-4000-8000-000000000001',
        ]);
      });

      fireEvent.keyDown(editor, { key: 'Enter', shiftKey: false });

      await waitFor(() => {
        expect(proxy.getEditorText()).toBe('');
      });

      expect(proxy.getThumbnailAttachmentIds()).toStrictEqual([]);
    });

    it('VALID: {accepted send after a draft had been saved} => #check-draft-removed the localStorage draft key is absent and the IndexedDB draft store holds zero records', async () => {
      const proxy = ChatInputWidgetProxy();
      proxy.clearStorage();
      const onSendMessage = jest.fn(async (): Promise<void> => Promise.resolve());

      mantineRenderAdapter({
        ui: (
          <ChatInputWidget
            isStreaming={false}
            onSendMessage={onSendMessage}
            onStopChat={jest.fn()}
          />
        ),
      });

      const editor = screen.getByTestId('CHAT_INPUT');
      fireEvent.paste(editor, { clipboardData: proxy.pasteText({ text: 'hello world' }) });

      proxy.attachYields({
        attachment: ComposerAttachmentStub({
          attachmentId: 'a5000000-0000-4000-8000-000000000001',
        }),
      });
      fireEvent.paste(editor, {
        clipboardData: proxy.pasteImage({
          mediaType: 'image/png',
          bytes: new Uint8Array([1, 2, 3, 4]),
        }),
      });
      await waitFor(() => {
        expect(proxy.getThumbnailAttachmentIds()).toStrictEqual([
          'a5000000-0000-4000-8000-000000000001',
        ]);
      });

      fireEvent.keyDown(editor, { key: 'Enter', shiftKey: false });

      await waitFor(() => {
        expect(localStorage.getItem(chatComposerStatics.draftStorageKey)).toBe(null);
      });

      await expect(proxy.getStoredDraftImages()).resolves.toStrictEqual([]);
    });

    it('VALID: {accepted send} => #check-composer-editable-again CHAT_INPUT is editable and SEND_BUTTON is enabled', async () => {
      const proxy = ChatInputWidgetProxy();
      proxy.clearStorage();
      const onSendMessage = jest.fn(async (): Promise<void> => Promise.resolve());

      mantineRenderAdapter({
        ui: (
          <ChatInputWidget
            isStreaming={false}
            onSendMessage={onSendMessage}
            onStopChat={jest.fn()}
          />
        ),
      });

      const editor = screen.getByTestId('CHAT_INPUT');
      fireEvent.paste(editor, { clipboardData: proxy.pasteText({ text: 'hello' }) });
      fireEvent.keyDown(editor, { key: 'Enter', shiftKey: false });

      await waitFor(() => {
        expect(proxy.isEditorEditable()).toBe(true);
      });

      expect(proxy.isSendButtonDisabled()).toBe(false);
    });

    it('VALID: {accepted send that carried one image} => #check-progress-bar-gone-on-success the upload progress bar is no longer in the document', async () => {
      const proxy = ChatInputWidgetProxy();
      proxy.clearStorage();
      const onSendMessage = jest.fn(async (): Promise<void> => Promise.resolve());

      mantineRenderAdapter({
        ui: (
          <ChatInputWidget
            isStreaming={false}
            onSendMessage={onSendMessage}
            onStopChat={jest.fn()}
          />
        ),
      });

      const editor = screen.getByTestId('CHAT_INPUT');
      proxy.attachYields({
        attachment: ComposerAttachmentStub({
          attachmentId: 'a6000000-0000-4000-8000-000000000001',
        }),
      });
      fireEvent.paste(editor, {
        clipboardData: proxy.pasteImage({
          mediaType: 'image/png',
          bytes: new Uint8Array([1, 2, 3, 4]),
        }),
      });
      await waitFor(() => {
        expect(proxy.getThumbnailAttachmentIds()).toStrictEqual([
          'a6000000-0000-4000-8000-000000000001',
        ]);
      });

      fireEvent.keyDown(editor, { key: 'Enter', shiftKey: false });

      await waitFor(() => {
        expect(proxy.hasProgressBar()).toBe(false);
      });

      expect(proxy.hasProgressBar()).toBe(false);
    });
  });
});
