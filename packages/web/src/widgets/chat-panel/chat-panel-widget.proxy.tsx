import { screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

import { ChatMessageWidgetProxy } from '../chat-message/chat-message-widget.proxy';
import { ContextDividerWidgetProxy } from '../context-divider/context-divider-widget.proxy';
import { PixelSpriteWidgetProxy } from '../pixel-sprite/pixel-sprite-widget.proxy';
import { SubagentChainWidgetProxy } from '../subagent-chain/subagent-chain-widget.proxy';
import { ToolGroupWidgetProxy } from '../tool-group/tool-group-widget.proxy';

export const ChatPanelWidgetProxy = (): {
  typeMessage: (params: { text: string }) => Promise<void>;
  clickSend: () => Promise<void>;
  clickStop: () => Promise<void>;
  isInputEmpty: () => boolean;
  isStreamingVisible: () => boolean;
  isStopButtonVisible: () => boolean;
  isSendButtonVisible: () => boolean;
  hasMessageCount: (params: { count: number }) => boolean;
  hasToolGroupCount: (params: { count: number }) => boolean;
  hasDividerCount: (params: { count: number }) => boolean;
  hasSubagentChainCount: (params: { count: number }) => boolean;
} => {
  ChatMessageWidgetProxy();
  PixelSpriteWidgetProxy();
  ToolGroupWidgetProxy();
  ContextDividerWidgetProxy();
  SubagentChainWidgetProxy();

  return {
    typeMessage: async ({ text }: { text: string }): Promise<void> => {
      await userEvent.type(screen.getByPlaceholderText('Describe your quest...'), text);
    },
    clickSend: async (): Promise<void> => {
      await userEvent.click(screen.getByTestId('SEND_BUTTON'));
    },
    clickStop: async (): Promise<void> => {
      await userEvent.click(screen.getByTestId('STOP_BUTTON'));
    },
    isInputEmpty: (): boolean => {
      const textarea = screen.getByPlaceholderText('Describe your quest...');
      return (textarea as HTMLTextAreaElement).value === '';
    },
    isStreamingVisible: (): boolean => screen.queryByTestId('STREAMING_INDICATOR') !== null,
    isStopButtonVisible: (): boolean => screen.queryByTestId('STOP_BUTTON') !== null,
    isSendButtonVisible: (): boolean => screen.queryByTestId('SEND_BUTTON') !== null,
    hasMessageCount: ({ count }: { count: number }): boolean =>
      screen.queryAllByTestId('CHAT_MESSAGE').length === count,
    hasToolGroupCount: ({ count }: { count: number }): boolean =>
      screen.queryAllByTestId('TOOL_GROUP_HEADER').length === count,
    hasDividerCount: ({ count }: { count: number }): boolean =>
      screen.queryAllByTestId('CONTEXT_DIVIDER').length === count,
    hasSubagentChainCount: ({ count }: { count: number }): boolean =>
      screen.queryAllByTestId('SUBAGENT_CHAIN_HEADER').length === count,
  };
};
