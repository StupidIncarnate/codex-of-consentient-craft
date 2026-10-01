import { readItem } from '#gateway/browser/localStorage';
import { screen, waitFor } from '#gateway/npm/testing-library__react';

import { mantineRenderMiddleware } from '@dungeonmaster/testing/middleware/mantine-render';

import { ComposerAttachmentStub } from '../../contracts/composer-attachment/composer-attachment.stub';
import { chatComposerStatics } from '../../statics/chat-composer/chat-composer-statics';
import { ChatComposerWidget } from './chat-composer-widget';
import type { ChatComposerWidgetProps } from './chat-composer-widget';
import { ChatComposerWidgetProxy } from './chat-composer-widget.proxy';

type SubmitParams = Parameters<ChatComposerWidgetProps['onSubmit']>[0];

describe('ChatComposerWidget', () => {
  describe('Enter submits', () => {
    it('VALID: {text: "  hello  "} => Enter calls onSubmit once with the trimmed text and no images', async () => {
      const proxy = ChatComposerWidgetProxy();
      const onSubmit = jest.fn(async (_params: SubmitParams): Promise<void> => Promise.resolve());

      mantineRenderMiddleware({
        ui: <ChatComposerWidget placeholder="Say it" onSubmit={onSubmit} />,
      });

      proxy.typeText({ text: '  hello  ' });
      proxy.pressEnter();

      await waitFor(() => {
        expect(onSubmit).toHaveBeenCalledTimes(1);
      });

      expect(onSubmit).toHaveBeenCalledWith({ text: 'hello', images: [] });
    });

    it('VALID: {text: "hello"} => the send button submits the same payload as Enter', async () => {
      const proxy = ChatComposerWidgetProxy();
      const onSubmit = jest.fn(async (_params: SubmitParams): Promise<void> => Promise.resolve());

      mantineRenderMiddleware({
        ui: <ChatComposerWidget placeholder="Say it" onSubmit={onSubmit} />,
      });

      proxy.typeText({ text: 'hello' });
      proxy.clickSend();

      await waitFor(() => {
        expect(onSubmit).toHaveBeenCalledTimes(1);
      });

      expect(onSubmit).toHaveBeenCalledWith({ text: 'hello', images: [] });
    });
  });

  describe('Shift+Enter', () => {
    it('VALID: {text: "ab"} => Shift+Enter inserts a newline and submits nothing', () => {
      const proxy = ChatComposerWidgetProxy();
      const onSubmit = jest.fn(async (_params: SubmitParams): Promise<void> => Promise.resolve());

      mantineRenderMiddleware({
        ui: <ChatComposerWidget placeholder="Say it" onSubmit={onSubmit} />,
      });

      proxy.typeText({ text: 'ab' });
      proxy.pressShiftEnter();

      expect(proxy.getText()).toBe('ab\n');
      expect(onSubmit).toHaveBeenCalledTimes(0);
    });
  });

  describe('the nothing-to-send guard', () => {
    it('EMPTY: {text: "   ", hasSelection: false} => Enter submits nothing', () => {
      const proxy = ChatComposerWidgetProxy();
      const onSubmit = jest.fn(async (_params: SubmitParams): Promise<void> => Promise.resolve());

      mantineRenderMiddleware({
        ui: <ChatComposerWidget placeholder="Say it" onSubmit={onSubmit} />,
      });

      proxy.typeText({ text: '   ' });
      proxy.pressEnter();

      expect(onSubmit).toHaveBeenCalledTimes(0);
    });

    it('EMPTY: {text: "   ", hasSelection: false} => the send button submits nothing', () => {
      const proxy = ChatComposerWidgetProxy();
      const onSubmit = jest.fn(async (_params: SubmitParams): Promise<void> => Promise.resolve());

      mantineRenderMiddleware({
        ui: <ChatComposerWidget placeholder="Say it" onSubmit={onSubmit} />,
      });

      proxy.typeText({ text: '   ' });
      proxy.clickSend();

      expect(onSubmit).toHaveBeenCalledTimes(0);
    });

    it('VALID: {text: "   ", hasSelection: true} => Enter submits an empty text and no images', async () => {
      const proxy = ChatComposerWidgetProxy();
      const onSubmit = jest.fn(async (_params: SubmitParams): Promise<void> => Promise.resolve());

      mantineRenderMiddleware({
        ui: <ChatComposerWidget placeholder="Say it" onSubmit={onSubmit} hasSelection={true} />,
      });

      proxy.typeText({ text: '   ' });
      proxy.pressEnter();

      await waitFor(() => {
        expect(onSubmit).toHaveBeenCalledTimes(1);
      });

      expect(onSubmit).toHaveBeenCalledWith({ text: '', images: [] });
    });

    it('VALID: {never typed, hasSelection: true} => the send button submits an empty text and no images', async () => {
      const proxy = ChatComposerWidgetProxy();
      const onSubmit = jest.fn(async (_params: SubmitParams): Promise<void> => Promise.resolve());

      mantineRenderMiddleware({
        ui: <ChatComposerWidget placeholder="Say it" onSubmit={onSubmit} hasSelection={true} />,
      });

      proxy.clickSend();

      await waitFor(() => {
        expect(onSubmit).toHaveBeenCalledTimes(1);
      });

      expect(onSubmit).toHaveBeenCalledWith({ text: '', images: [] });
    });
  });

  describe('what a settled submit does to the editor', () => {
    it('VALID: {onSubmit resolves} => the editor is cleared', async () => {
      const proxy = ChatComposerWidgetProxy();
      const onSubmit = jest.fn(async (_params: SubmitParams): Promise<void> => Promise.resolve());

      mantineRenderMiddleware({
        ui: <ChatComposerWidget placeholder="Say it" onSubmit={onSubmit} />,
      });

      proxy.typeText({ text: 'hello' });
      proxy.pressEnter();

      await waitFor(() => {
        expect(proxy.getText()).toBe('');
      });

      expect(onSubmit).toHaveBeenCalledTimes(1);
    });

    it('ERROR: {onSubmit rejects} => the text is kept, the error message is toasted and the editor is editable again', async () => {
      const proxy = ChatComposerWidgetProxy();
      const onSubmit = jest.fn(async (_params: SubmitParams): Promise<void> =>
        Promise.reject(new Error('server said no')),
      );

      mantineRenderMiddleware({
        ui: <ChatComposerWidget placeholder="Say it" onSubmit={onSubmit} />,
      });

      proxy.typeText({ text: 'hello' });
      proxy.pressEnter();

      await waitFor(() => {
        expect(proxy.getShownToast()).toStrictEqual({
          message: 'server said no',
          color: chatComposerStatics.toastColor,
        });
      });

      await waitFor(() => {
        expect(proxy.isEditorEditable()).toBe(true);
      });

      expect(proxy.getText()).toBe('hello');
    });
  });

  describe('the editor placeholder', () => {
    it('VALID: {placeholder: "Say it"} => shows the placeholder while the editor is empty', () => {
      ChatComposerWidgetProxy();

      mantineRenderMiddleware({
        ui: (
          <ChatComposerWidget
            placeholder="Say it"
            onSubmit={jest.fn(async (_params: SubmitParams): Promise<void> => Promise.resolve())}
          />
        ),
      });

      expect(screen.getByTestId('CHAT_INPUT_PLACEHOLDER').textContent).toBe('Say it');
    });
  });

  describe('overridable test ids', () => {
    it('VALID: {testIds} => the editor, placeholder and send button carry the given ids', () => {
      ChatComposerWidgetProxy();

      mantineRenderMiddleware({
        ui: (
          <ChatComposerWidget
            placeholder="Say it"
            onSubmit={jest.fn(async (_params: SubmitParams): Promise<void> => Promise.resolve())}
            testIds={{
              editor: 'CLARIFY_INPUT',
              placeholder: 'CLARIFY_INPUT_PLACEHOLDER',
              sendButton: 'CLARIFY_SEND',
            }}
          />
        ),
      });

      expect({
        editorEditable: screen.getByTestId('CLARIFY_INPUT').getAttribute('contenteditable'),
        placeholderText: screen.getByTestId('CLARIFY_INPUT_PLACEHOLDER').textContent,
        sendButtonDisabled: screen.getByTestId('CLARIFY_SEND').hasAttribute('disabled'),
        defaultEditor: screen.queryByTestId('CHAT_INPUT'),
      }).toStrictEqual({
        editorEditable: 'true',
        placeholderText: 'Say it',
        sendButtonDisabled: false,
        defaultEditor: null,
      });
    });
  });

  describe('image paste', () => {
    it('VALID: {paste image/png} => the thumbnail lands in the editor and the send carries the image', async () => {
      const proxy = ChatComposerWidgetProxy();
      const onSubmit = jest.fn(async (_params: SubmitParams): Promise<void> => Promise.resolve());

      mantineRenderMiddleware({
        ui: <ChatComposerWidget placeholder="Say it" onSubmit={onSubmit} />,
      });

      proxy.pasteImage({
        mediaType: 'image/png',
        bytes: new Uint8Array([137, 80, 78, 71]),
        attachment: ComposerAttachmentStub({
          attachmentId: 'c0000000-0000-4000-8000-000000000001',
        }),
      });

      await waitFor(() => {
        expect(proxy.hasThumbnail()).toBe(true);
      });

      proxy.pressEnter();

      await waitFor(() => {
        expect(onSubmit).toHaveBeenCalledTimes(1);
      });

      const submitted = onSubmit.mock.calls[0]?.[0];

      expect({ text: submitted?.text, imageCount: submitted?.images.length }).toStrictEqual({
        text: '[Pasted Image 1]',
        imageCount: 1,
      });
    });
  });

  describe('draft storage', () => {
    it('VALID: {type, send} => writes no localStorage draft', async () => {
      const proxy = ChatComposerWidgetProxy();
      const onSubmit = jest.fn(async (_params: SubmitParams): Promise<void> => Promise.resolve());
      const draftKey = `${chatComposerStatics.draftStorageKeyPrefix}:${chatComposerStatics.draftScope.createScopeKey}`;

      mantineRenderMiddleware({
        ui: <ChatComposerWidget placeholder="Say it" onSubmit={onSubmit} />,
      });

      proxy.typeText({ text: 'draft text' });

      expect(readItem({ key: draftKey })).toBe(null);

      proxy.pressEnter();

      await waitFor(() => {
        expect(onSubmit).toHaveBeenCalledTimes(1);
      });

      expect(readItem({ key: draftKey })).toBe(null);
    });
  });
});
