import { screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

import { ChatMessageWidgetProxy } from '../chat-message/chat-message-widget.proxy';
import { PixelSpriteWidgetProxy } from '../pixel-sprite/pixel-sprite-widget.proxy';

export const ChatPanelWidgetProxy = (): {
  typeMessage: (params: { text: string }) => Promise<void>;
  clickSend: () => Promise<void>;
  isInputEmpty: () => boolean;
  isStreamingVisible: () => boolean;
  hasMessageCount: (params: { count: number }) => boolean;
} => {
  ChatMessageWidgetProxy();
  PixelSpriteWidgetProxy();

  return {
    typeMessage: async ({ text }: { text: string }): Promise<void> => {
      await userEvent.type(screen.getByPlaceholderText('Describe your quest...'), text);
    },
    clickSend: async (): Promise<void> => {
      await userEvent.click(screen.getByTestId('SEND_BUTTON'));
    },
    isInputEmpty: (): boolean => {
      const textarea = screen.getByPlaceholderText('Describe your quest...');
      return (textarea as HTMLTextAreaElement).value === '';
    },
    isStreamingVisible: (): boolean => screen.queryByTestId('STREAMING_INDICATOR') !== null,
    hasMessageCount: ({ count }: { count: number }): boolean =>
      screen.queryAllByTestId('CHAT_MESSAGE').length === count,
  };
};
