import { fireEvent, screen } from '@testing-library/react';

import { mantineRenderAdapter } from '../../adapters/mantine/render/mantine-render-adapter';
import { ChatInputWidget } from './chat-input-widget';
import { ChatInputWidgetProxy } from './chat-input-widget.proxy';

const DRAFT_STORAGE_KEY = 'dungeonmaster-chat-draft';

describe('ChatInputWidget', () => {
  beforeEach(() => {
    localStorage.clear();
  });

  describe('rendering', () => {
    it('VALID: {isStreaming: false} => renders textarea and send button', () => {
      ChatInputWidgetProxy();
      const onSendMessage = jest.fn();
      const onStopChat = jest.fn();

      mantineRenderAdapter({
        ui: (
          <ChatInputWidget
            isStreaming={false}
            onSendMessage={onSendMessage}
            onStopChat={onStopChat}
          />
        ),
      });

      expect(screen.getByTestId('CHAT_INPUT')).toBe(screen.getByTestId('CHAT_INPUT'));
      expect(screen.getByTestId('SEND_BUTTON')).toBe(screen.getByTestId('SEND_BUTTON'));
      expect(screen.queryByTestId('STOP_BUTTON')).toBeNull();
      expect(screen.queryByTestId('STREAMING_INDICATOR')).toBeNull();
    });

    it('VALID: {isStreaming: true} => renders stop button and streaming indicator', () => {
      ChatInputWidgetProxy();
      const onSendMessage = jest.fn();
      const onStopChat = jest.fn();

      mantineRenderAdapter({
        ui: (
          <ChatInputWidget
            isStreaming={true}
            onSendMessage={onSendMessage}
            onStopChat={onStopChat}
          />
        ),
      });

      expect(screen.getByTestId('STOP_BUTTON')).toBe(screen.getByTestId('STOP_BUTTON'));
      expect(screen.getByTestId('STREAMING_INDICATOR')).toBe(
        screen.getByTestId('STREAMING_INDICATOR'),
      );
      expect(screen.queryByTestId('SEND_BUTTON')).toBeNull();
    });

    it('VALID: {isStreaming: true} => textarea is disabled', () => {
      ChatInputWidgetProxy();

      mantineRenderAdapter({
        ui: <ChatInputWidget isStreaming={true} onSendMessage={jest.fn()} onStopChat={jest.fn()} />,
      });

      const textarea = screen.getByTestId('CHAT_INPUT');

      expect(textarea.disabled).toBe(true);
    });
  });

  describe('send message', () => {
    it('VALID: {type text, press Enter} => calls onSendMessage with trimmed text', () => {
      ChatInputWidgetProxy();
      const onSendMessage = jest.fn();

      mantineRenderAdapter({
        ui: (
          <ChatInputWidget
            isStreaming={false}
            onSendMessage={onSendMessage}
            onStopChat={jest.fn()}
          />
        ),
      });

      const textarea = screen.getByTestId('CHAT_INPUT');

      fireEvent.change(textarea, { target: { value: '  hello world  ' } });
      fireEvent.keyDown(textarea, { key: 'Enter', shiftKey: false });

      expect(onSendMessage).toHaveBeenCalledWith({ message: 'hello world' });
    });

    it('VALID: {click send button} => calls onSendMessage', () => {
      ChatInputWidgetProxy();
      const onSendMessage = jest.fn();

      mantineRenderAdapter({
        ui: (
          <ChatInputWidget
            isStreaming={false}
            onSendMessage={onSendMessage}
            onStopChat={jest.fn()}
          />
        ),
      });

      const textarea = screen.getByTestId('CHAT_INPUT');

      fireEvent.change(textarea, { target: { value: 'test message' } });
      fireEvent.click(screen.getByTestId('SEND_BUTTON'));

      expect(onSendMessage).toHaveBeenCalledWith({ message: 'test message' });
    });

    it('VALID: {empty input, press Enter} => does not call onSendMessage', () => {
      ChatInputWidgetProxy();
      const onSendMessage = jest.fn();

      mantineRenderAdapter({
        ui: (
          <ChatInputWidget
            isStreaming={false}
            onSendMessage={onSendMessage}
            onStopChat={jest.fn()}
          />
        ),
      });

      const textarea = screen.getByTestId('CHAT_INPUT');

      fireEvent.keyDown(textarea, { key: 'Enter', shiftKey: false });

      expect(onSendMessage).not.toHaveBeenCalled();
    });

    it('VALID: {Shift+Enter} => does not send message', () => {
      ChatInputWidgetProxy();
      const onSendMessage = jest.fn();

      mantineRenderAdapter({
        ui: (
          <ChatInputWidget
            isStreaming={false}
            onSendMessage={onSendMessage}
            onStopChat={jest.fn()}
          />
        ),
      });

      const textarea = screen.getByTestId('CHAT_INPUT');

      fireEvent.change(textarea, { target: { value: 'hello' } });
      fireEvent.keyDown(textarea, { key: 'Enter', shiftKey: true });

      expect(onSendMessage).not.toHaveBeenCalled();
    });

    it('VALID: {send message} => clears textarea after sending', () => {
      ChatInputWidgetProxy();

      mantineRenderAdapter({
        ui: (
          <ChatInputWidget isStreaming={false} onSendMessage={jest.fn()} onStopChat={jest.fn()} />
        ),
      });

      const textarea = screen.getByTestId('CHAT_INPUT');

      fireEvent.change(textarea, { target: { value: 'hello' } });
      fireEvent.keyDown(textarea, { key: 'Enter', shiftKey: false });

      expect(textarea.value).toBe('');
    });
  });

  describe('stop chat', () => {
    it('VALID: {click stop button} => calls onStopChat', () => {
      ChatInputWidgetProxy();
      const onStopChat = jest.fn();

      mantineRenderAdapter({
        ui: (
          <ChatInputWidget isStreaming={true} onSendMessage={jest.fn()} onStopChat={onStopChat} />
        ),
      });

      fireEvent.click(screen.getByTestId('STOP_BUTTON'));

      expect(onStopChat).toHaveBeenCalledTimes(1);
    });
  });

  describe('localStorage persistence', () => {
    it('VALID: {type text} => saves draft to localStorage', () => {
      ChatInputWidgetProxy();

      mantineRenderAdapter({
        ui: (
          <ChatInputWidget isStreaming={false} onSendMessage={jest.fn()} onStopChat={jest.fn()} />
        ),
      });

      const textarea = screen.getByTestId('CHAT_INPUT');

      fireEvent.change(textarea, { target: { value: 'my draft' } });

      expect(localStorage.getItem(DRAFT_STORAGE_KEY)).toBe('my draft');
    });

    it('VALID: {existing draft in localStorage} => restores on mount', () => {
      ChatInputWidgetProxy();
      localStorage.setItem(DRAFT_STORAGE_KEY, 'saved draft');

      mantineRenderAdapter({
        ui: (
          <ChatInputWidget isStreaming={false} onSendMessage={jest.fn()} onStopChat={jest.fn()} />
        ),
      });

      const textarea = screen.getByTestId('CHAT_INPUT');

      expect(textarea.value).toBe('saved draft');
    });

    it('VALID: {send message} => removes draft from localStorage', () => {
      ChatInputWidgetProxy();
      localStorage.setItem(DRAFT_STORAGE_KEY, 'will be cleared');

      mantineRenderAdapter({
        ui: (
          <ChatInputWidget isStreaming={false} onSendMessage={jest.fn()} onStopChat={jest.fn()} />
        ),
      });

      const textarea = screen.getByTestId('CHAT_INPUT');

      fireEvent.keyDown(textarea, { key: 'Enter', shiftKey: false });

      expect(localStorage.getItem(DRAFT_STORAGE_KEY)).toBeNull();
    });

    it('VALID: {no saved draft} => starts with empty textarea', () => {
      ChatInputWidgetProxy();

      mantineRenderAdapter({
        ui: (
          <ChatInputWidget isStreaming={false} onSendMessage={jest.fn()} onStopChat={jest.fn()} />
        ),
      });

      const textarea = screen.getByTestId('CHAT_INPUT');

      expect(textarea.value).toBe('');
    });
  });
});
