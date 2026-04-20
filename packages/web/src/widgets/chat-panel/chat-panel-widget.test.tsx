import { screen } from '@testing-library/react';

import { mantineRenderAdapter } from '../../adapters/mantine/render/mantine-render-adapter';
import { ChatPanelWidget } from './chat-panel-widget';
import { ChatPanelWidgetProxy } from './chat-panel-widget.proxy';

describe('ChatPanelWidget', () => {
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

      expect(screen.queryByTestId('RACCOON_SPRITE')).toBeInTheDocument();
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

  describe('streaming state wiring', () => {
    it('VALID: {isStreaming: true} => shows streaming indicator via child list', () => {
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

    it('VALID: {isStreaming: false} => does not show streaming indicator', () => {
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

      const textarea = screen.getByRole('textbox');

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
