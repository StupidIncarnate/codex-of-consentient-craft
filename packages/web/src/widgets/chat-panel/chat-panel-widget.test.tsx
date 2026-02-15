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
        ui: <ChatPanelWidget entries={entries} isStreaming={false} onSendMessage={jest.fn()} />,
      });

      expect(proxy.hasMessageCount({ count: 2 })).toBe(true);
    });

    it('VALID: {entries with tool use} => renders tool call message', () => {
      const proxy = ChatPanelWidgetProxy();
      const entries = [
        UserChatEntryStub({ content: 'Do something' }),
        AssistantToolUseChatEntryStub({ toolName: 'read_file', toolInput: '{"path":"/src"}' }),
      ];

      mantineRenderAdapter({
        ui: <ChatPanelWidget entries={entries} isStreaming={false} onSendMessage={jest.fn()} />,
      });

      expect(proxy.hasMessageCount({ count: 2 })).toBe(true);

      const messages = screen.getAllByTestId('CHAT_MESSAGE');
      const toolMessage = messages.at(1)!;

      expect(toolMessage.textContent).toMatch(/TOOL CALL/u);
    });

    it('EMPTY: {no entries} => renders empty message area', () => {
      const proxy = ChatPanelWidgetProxy();

      mantineRenderAdapter({
        ui: <ChatPanelWidget entries={[]} isStreaming={false} onSendMessage={jest.fn()} />,
      });

      expect(proxy.hasMessageCount({ count: 0 })).toBe(true);
    });
  });

  describe('raccoon sprite', () => {
    it('VALID: {rendered} => displays raccoon sprite', () => {
      ChatPanelWidgetProxy();

      mantineRenderAdapter({
        ui: <ChatPanelWidget entries={[]} isStreaming={false} onSendMessage={jest.fn()} />,
      });

      expect(screen.queryByTestId('RACCOON_SPRITE')).not.toBeNull();
    });
  });

  describe('send message via button', () => {
    it('VALID: {typed message, click send} => calls onSendMessage and clears input', async () => {
      const proxy = ChatPanelWidgetProxy();
      const onSendMessage = jest.fn();

      mantineRenderAdapter({
        ui: <ChatPanelWidget entries={[]} isStreaming={false} onSendMessage={onSendMessage} />,
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
        ui: <ChatPanelWidget entries={[]} isStreaming={false} onSendMessage={onSendMessage} />,
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
        ui: <ChatPanelWidget entries={[]} isStreaming={false} onSendMessage={onSendMessage} />,
      });

      await proxy.typeMessage({ text: 'Build auth flow{enter}' });

      expect(onSendMessage).toHaveBeenCalledTimes(1);
      expect(onSendMessage).toHaveBeenCalledWith({ message: 'Build auth flow' });
      expect(proxy.isInputEmpty()).toBe(true);
    });
  });

  describe('streaming state', () => {
    it('VALID: {isStreaming: true} => shows Thinking indicator', () => {
      const proxy = ChatPanelWidgetProxy();

      mantineRenderAdapter({
        ui: <ChatPanelWidget entries={[]} isStreaming={true} onSendMessage={jest.fn()} />,
      });

      expect(proxy.isStreamingVisible()).toBe(true);
    });

    it('VALID: {isStreaming: false} => does not show Thinking indicator', () => {
      const proxy = ChatPanelWidgetProxy();

      mantineRenderAdapter({
        ui: <ChatPanelWidget entries={[]} isStreaming={false} onSendMessage={jest.fn()} />,
      });

      expect(proxy.isStreamingVisible()).toBe(false);
    });

    it('VALID: {isStreaming: true} => disables textarea', () => {
      ChatPanelWidgetProxy();

      mantineRenderAdapter({
        ui: <ChatPanelWidget entries={[]} isStreaming={true} onSendMessage={jest.fn()} />,
      });

      const textarea = screen.getByPlaceholderText('Describe your quest...');

      expect((textarea as HTMLTextAreaElement).disabled).toBe(true);
    });

    it('VALID: {isStreaming: true} => disables send button', () => {
      ChatPanelWidgetProxy();

      mantineRenderAdapter({
        ui: <ChatPanelWidget entries={[]} isStreaming={true} onSendMessage={jest.fn()} />,
      });

      const button = screen.getByTestId('SEND_BUTTON');

      expect((button as HTMLButtonElement).disabled).toBe(true);
    });
  });
});
