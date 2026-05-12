import { screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

import { ChatMessageWidgetProxy } from '../chat-message/chat-message-widget.proxy';
import { ShowEarlierToggleWidgetProxy } from '../show-earlier-toggle/show-earlier-toggle-widget.proxy';
import { ToolRowWidgetProxy } from '../tool-row/tool-row-widget.proxy';

export const SubagentChainWidgetProxy = (): {
  clickHeader: () => Promise<void>;
  clickShowEarlier: () => Promise<void>;
  isHeaderVisible: () => boolean;
  isBadgeVisible: () => boolean;
  hasShowEarlierToggle: () => boolean;
  hasInnerGroupCount: (params: { count: number }) => boolean;
} => {
  ChatMessageWidgetProxy();
  ShowEarlierToggleWidgetProxy();
  ToolRowWidgetProxy();

  return {
    clickHeader: async (): Promise<void> => {
      await userEvent.click(screen.getByTestId('SUBAGENT_CHAIN_HEADER'));
    },
    clickShowEarlier: async (): Promise<void> => {
      await userEvent.click(screen.getByTestId('SUBAGENT_CHAIN_SHOW_EARLIER_TOGGLE'));
    },
    isHeaderVisible: (): boolean => screen.queryByTestId('SUBAGENT_CHAIN_HEADER') !== null,
    isBadgeVisible: (): boolean =>
      screen.getByTestId('SUBAGENT_CHAIN_HEADER').textContent?.includes('SUB-AGENT') ?? false,
    hasShowEarlierToggle: (): boolean =>
      screen.queryByTestId('SUBAGENT_CHAIN_SHOW_EARLIER_TOGGLE') !== null,
    hasInnerGroupCount: ({ count }: { count: number }): boolean =>
      screen.queryAllByTestId('CHAT_MESSAGE').length === count,
  };
};
