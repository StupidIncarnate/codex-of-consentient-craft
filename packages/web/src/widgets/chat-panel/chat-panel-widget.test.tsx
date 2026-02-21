import { screen } from '@testing-library/react';

import { mantineRenderAdapter } from '../../adapters/mantine/render/mantine-render-adapter';
import {
  AssistantTextChatEntryStub,
  AssistantToolUseChatEntryStub,
  UserChatEntryStub,
} from '../../contracts/chat-entry/chat-entry.stub';
import { ChatPanelWidget } from './chat-panel-widget';
import { ChatPanelWidgetProxy } from './chat-panel-widget.proxy';

describe('ChatPanelWidget', () => {
  describe('message rendering', () => {
    it('VALID: {entries with user and assistant} => renders all messages', () => {
      const proxy = ChatPanelWidgetProxy();
      const entries = [
        UserChatEntryStub({ content: 'Hello' }),
        AssistantTextChatEntryStub({ content: 'Hi there' }),
      ];

      mantineRenderAdapter({
        ui: (
          <ChatPanelWidget
            entries={entries}
            isStreaming={false}
            onSendMessage={jest.fn()}
            onStopChat={jest.fn()}
          />
        ),
      });

      expect(proxy.hasMessageCount({ count: 2 })).toBe(true);
    });

    it('VALID: {entries with tool use} => renders user message and tool group header', () => {
      const proxy = ChatPanelWidgetProxy();
      const entries = [
        UserChatEntryStub({ content: 'Do something' }),
        AssistantToolUseChatEntryStub({ toolName: 'read_file', toolInput: '{"path":"/src"}' }),
      ];

      mantineRenderAdapter({
        ui: (
          <ChatPanelWidget
            entries={entries}
            isStreaming={false}
            onSendMessage={jest.fn()}
            onStopChat={jest.fn()}
          />
        ),
      });

      expect(proxy.hasMessageCount({ count: 1 })).toBe(true);
      expect(proxy.hasToolGroupCount({ count: 1 })).toBe(true);
    });

    it('VALID: {tool_use as last entry, isStreaming true} => shows Running indicator', () => {
      ChatPanelWidgetProxy();
      const entries = [
        UserChatEntryStub({ content: 'Do something' }),
        AssistantToolUseChatEntryStub({ toolName: 'Read', toolInput: '{"path":"/src"}' }),
      ];

      mantineRenderAdapter({
        ui: (
          <ChatPanelWidget
            entries={entries}
            isStreaming={true}
            onSendMessage={jest.fn()}
            onStopChat={jest.fn()}
          />
        ),
      });

      expect(screen.queryByTestId('TOOL_LOADING')).not.toBeNull();
    });

    it('VALID: {multiple parallel tool_use, no text response, isStreaming true} => shows Running on last entry of last tool group', () => {
      ChatPanelWidgetProxy();
      const entries = [
        UserChatEntryStub({ content: 'Do something' }),
        AssistantToolUseChatEntryStub({ toolName: 'Bash', toolInput: '{"command":"ls cli"}' }),
        AssistantToolUseChatEntryStub({
          toolName: 'Bash',
          toolInput: '{"command":"ls standards"}',
        }),
        AssistantToolUseChatEntryStub({ toolName: 'Task', toolInput: '{"prompt":"explore"}' }),
      ];

      mantineRenderAdapter({
        ui: (
          <ChatPanelWidget
            entries={entries}
            isStreaming={true}
            onSendMessage={jest.fn()}
            onStopChat={jest.fn()}
          />
        ),
      });

      const loadingIndicators = screen.queryAllByTestId('TOOL_LOADING');

      expect(loadingIndicators).toHaveLength(1);
    });

    it('VALID: {previous turn tool_use, new turn streaming} => does not show Running on previous turn tools', () => {
      ChatPanelWidgetProxy();
      const entries = [
        UserChatEntryStub({ content: 'First question' }),
        AssistantToolUseChatEntryStub({ toolName: 'Bash', toolInput: '{"command":"ls cli"}' }),
        AssistantToolUseChatEntryStub({
          toolName: 'Bash',
          toolInput: '{"command":"ls standards"}',
        }),
        AssistantTextChatEntryStub({ content: 'Here are the results' }),
        UserChatEntryStub({ content: 'Second question' }),
        AssistantToolUseChatEntryStub({ toolName: 'Task', toolInput: '{"prompt":"explore"}' }),
      ];

      mantineRenderAdapter({
        ui: (
          <ChatPanelWidget
            entries={entries}
            isStreaming={true}
            onSendMessage={jest.fn()}
            onStopChat={jest.fn()}
          />
        ),
      });

      const loadingIndicators = screen.queryAllByTestId('TOOL_LOADING');

      expect(loadingIndicators).toHaveLength(1);
    });

    it('VALID: {tool_use with text response after, isStreaming true} => does not show Running when text response exists', () => {
      ChatPanelWidgetProxy();
      const entries = [
        UserChatEntryStub({ content: 'Do something' }),
        AssistantToolUseChatEntryStub({ toolName: 'Bash', toolInput: '{"command":"ls cli"}' }),
        AssistantToolUseChatEntryStub({
          toolName: 'Bash',
          toolInput: '{"command":"ls standards"}',
        }),
        AssistantTextChatEntryStub({ content: 'Here are the results' }),
      ];

      mantineRenderAdapter({
        ui: (
          <ChatPanelWidget
            entries={entries}
            isStreaming={true}
            onSendMessage={jest.fn()}
            onStopChat={jest.fn()}
          />
        ),
      });

      const loadingIndicators = screen.queryAllByTestId('TOOL_LOADING');

      expect(loadingIndicators).toHaveLength(0);
    });

    it('VALID: {tool_use as last entry, isStreaming false} => does not show Running indicator', () => {
      ChatPanelWidgetProxy();
      const entries = [
        UserChatEntryStub({ content: 'Do something' }),
        AssistantToolUseChatEntryStub({ toolName: 'Read', toolInput: '{"path":"/src"}' }),
      ];

      mantineRenderAdapter({
        ui: (
          <ChatPanelWidget
            entries={entries}
            isStreaming={false}
            onSendMessage={jest.fn()}
            onStopChat={jest.fn()}
          />
        ),
      });

      expect(screen.queryByTestId('TOOL_LOADING')).toBeNull();
    });

    it('EMPTY: {no entries} => renders empty message area', () => {
      const proxy = ChatPanelWidgetProxy();

      mantineRenderAdapter({
        ui: (
          <ChatPanelWidget
            entries={[]}
            isStreaming={false}
            onSendMessage={jest.fn()}
            onStopChat={jest.fn()}
          />
        ),
      });

      expect(proxy.hasMessageCount({ count: 0 })).toBe(true);
    });
  });

  describe('raccoon sprite', () => {
    it('VALID: {rendered} => displays raccoon sprite', () => {
      ChatPanelWidgetProxy();

      mantineRenderAdapter({
        ui: (
          <ChatPanelWidget
            entries={[]}
            isStreaming={false}
            onSendMessage={jest.fn()}
            onStopChat={jest.fn()}
          />
        ),
      });

      expect(screen.queryByTestId('RACCOON_SPRITE')).not.toBeNull();
    });
  });

  describe('send message via button', () => {
    it('VALID: {typed message, click send} => calls onSendMessage and clears input', async () => {
      const proxy = ChatPanelWidgetProxy();
      const onSendMessage = jest.fn();

      mantineRenderAdapter({
        ui: (
          <ChatPanelWidget
            entries={[]}
            isStreaming={false}
            onSendMessage={onSendMessage}
            onStopChat={jest.fn()}
          />
        ),
      });

      await proxy.typeMessage({ text: 'Build auth flow' });
      await proxy.clickSend();

      expect(onSendMessage).toHaveBeenCalledTimes(1);
      expect(onSendMessage).toHaveBeenCalledWith({ message: 'Build auth flow' });
      expect(proxy.isInputEmpty()).toBe(true);
    });

    it('EMPTY: {empty input, click send} => does not call onSendMessage', async () => {
      const proxy = ChatPanelWidgetProxy();
      const onSendMessage = jest.fn();

      mantineRenderAdapter({
        ui: (
          <ChatPanelWidget
            entries={[]}
            isStreaming={false}
            onSendMessage={onSendMessage}
            onStopChat={jest.fn()}
          />
        ),
      });

      await proxy.clickSend();

      expect(onSendMessage).toHaveBeenCalledTimes(0);
    });
  });

  describe('send message via enter key', () => {
    it('VALID: {typed message, press Enter} => calls onSendMessage and clears input', async () => {
      const proxy = ChatPanelWidgetProxy();
      const onSendMessage = jest.fn();

      mantineRenderAdapter({
        ui: (
          <ChatPanelWidget
            entries={[]}
            isStreaming={false}
            onSendMessage={onSendMessage}
            onStopChat={jest.fn()}
          />
        ),
      });

      await proxy.typeMessage({ text: 'Build auth flow{enter}' });

      expect(onSendMessage).toHaveBeenCalledTimes(1);
      expect(onSendMessage).toHaveBeenCalledWith({ message: 'Build auth flow' });
      expect(proxy.isInputEmpty()).toBe(true);
    });

    it('VALID: {typed message, press Shift+Enter} => does not send message', async () => {
      const proxy = ChatPanelWidgetProxy();
      const onSendMessage = jest.fn();

      mantineRenderAdapter({
        ui: (
          <ChatPanelWidget
            entries={[]}
            isStreaming={false}
            onSendMessage={onSendMessage}
            onStopChat={jest.fn()}
          />
        ),
      });

      await proxy.typeMessage({ text: 'line one{shift>}{enter}{/shift}line two' });

      expect(onSendMessage).toHaveBeenCalledTimes(0);
    });

    it('EMPTY: {empty input, press Enter} => does not call onSendMessage', async () => {
      const proxy = ChatPanelWidgetProxy();
      const onSendMessage = jest.fn();

      mantineRenderAdapter({
        ui: (
          <ChatPanelWidget
            entries={[]}
            isStreaming={false}
            onSendMessage={onSendMessage}
            onStopChat={jest.fn()}
          />
        ),
      });

      await proxy.typeMessage({ text: '{enter}' });

      expect(onSendMessage).toHaveBeenCalledTimes(0);
    });

    it('VALID: {typed message with whitespace, press Enter} => sends trimmed message', async () => {
      const proxy = ChatPanelWidgetProxy();
      const onSendMessage = jest.fn();

      mantineRenderAdapter({
        ui: (
          <ChatPanelWidget
            entries={[]}
            isStreaming={false}
            onSendMessage={onSendMessage}
            onStopChat={jest.fn()}
          />
        ),
      });

      await proxy.typeMessage({ text: '  hello  {enter}' });

      expect(onSendMessage).toHaveBeenCalledTimes(1);
      expect(onSendMessage).toHaveBeenCalledWith({ message: 'hello' });
    });
  });

  describe('streaming state', () => {
    it('VALID: {isStreaming: true} => shows Thinking indicator', () => {
      const proxy = ChatPanelWidgetProxy();

      mantineRenderAdapter({
        ui: (
          <ChatPanelWidget
            entries={[]}
            isStreaming={true}
            onSendMessage={jest.fn()}
            onStopChat={jest.fn()}
          />
        ),
      });

      expect(proxy.isStreamingVisible()).toBe(true);
    });

    it('VALID: {isStreaming: false} => does not show Thinking indicator', () => {
      const proxy = ChatPanelWidgetProxy();

      mantineRenderAdapter({
        ui: (
          <ChatPanelWidget
            entries={[]}
            isStreaming={false}
            onSendMessage={jest.fn()}
            onStopChat={jest.fn()}
          />
        ),
      });

      expect(proxy.isStreamingVisible()).toBe(false);
    });

    it('VALID: {isStreaming: true} => disables textarea', () => {
      ChatPanelWidgetProxy();

      mantineRenderAdapter({
        ui: (
          <ChatPanelWidget
            entries={[]}
            isStreaming={true}
            onSendMessage={jest.fn()}
            onStopChat={jest.fn()}
          />
        ),
      });

      const textarea = screen.getByPlaceholderText('Describe your quest...');

      expect((textarea as HTMLTextAreaElement).disabled).toBe(true);
    });

    it('VALID: {isStreaming: true} => shows stop button instead of send button', () => {
      const proxy = ChatPanelWidgetProxy();

      mantineRenderAdapter({
        ui: (
          <ChatPanelWidget
            entries={[]}
            isStreaming={true}
            onSendMessage={jest.fn()}
            onStopChat={jest.fn()}
          />
        ),
      });

      expect(proxy.isStopButtonVisible()).toBe(true);
      expect(proxy.isSendButtonVisible()).toBe(false);
    });

    it('VALID: {isStreaming: false} => shows send button instead of stop button', () => {
      const proxy = ChatPanelWidgetProxy();

      mantineRenderAdapter({
        ui: (
          <ChatPanelWidget
            entries={[]}
            isStreaming={false}
            onSendMessage={jest.fn()}
            onStopChat={jest.fn()}
          />
        ),
      });

      expect(proxy.isSendButtonVisible()).toBe(true);
      expect(proxy.isStopButtonVisible()).toBe(false);
    });
  });

  describe('stop chat', () => {
    it('VALID: {isStreaming, click stop} => calls onStopChat', async () => {
      const proxy = ChatPanelWidgetProxy();
      const onStopChat = jest.fn();

      mantineRenderAdapter({
        ui: (
          <ChatPanelWidget
            entries={[]}
            isStreaming={true}
            onSendMessage={jest.fn()}
            onStopChat={onStopChat}
          />
        ),
      });

      await proxy.clickStop();

      expect(onStopChat).toHaveBeenCalledTimes(1);
    });
  });
});
