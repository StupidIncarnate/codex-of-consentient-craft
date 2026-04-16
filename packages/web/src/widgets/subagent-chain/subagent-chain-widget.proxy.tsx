import { screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

import { ChatMessageWidgetProxy } from '../chat-message/chat-message-widget.proxy';
import { ToolRowWidgetProxy } from '../tool-row/tool-row-widget.proxy';

export const SubagentChainWidgetProxy = (): {
  clickHeader: () => Promise<void>;
  isHeaderVisible: () => boolean;
  isBadgeVisible: () => boolean;
  hasInnerGroupCount: (params: { count: number }) => boolean;
} => {
  ChatMessageWidgetProxy();
  ToolRowWidgetProxy();

  return {
    clickHeader: async (): Promise<void> => {
      await userEvent.click(screen.getByTestId('SUBAGENT_CHAIN_HEADER'));
    },
    isHeaderVisible: (): boolean => screen.queryByTestId('SUBAGENT_CHAIN_HEADER') !== null,
    isBadgeVisible: (): boolean =>
      screen.getByTestId('SUBAGENT_CHAIN_HEADER').textContent?.includes('SUB-AGENT') ?? false,
    hasInnerGroupCount: ({ count }: { count: number }): boolean =>
      screen.queryAllByTestId('CHAT_MESSAGE').length === count,
  };
};
