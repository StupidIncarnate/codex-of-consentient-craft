import { screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

import { ChatMessageWidgetProxy } from '../chat-message/chat-message-widget.proxy';

export const ToolGroupWidgetProxy = (): {
  clickHeader: () => Promise<void>;
  isHeaderVisible: () => boolean;
  isSubagentBadgeVisible: () => boolean;
  hasMessageCount: (params: { count: number }) => boolean;
} => {
  ChatMessageWidgetProxy();

  return {
    clickHeader: async (): Promise<void> => {
      await userEvent.click(screen.getByTestId('TOOL_GROUP_HEADER'));
    },
    isHeaderVisible: (): boolean => screen.queryByTestId('TOOL_GROUP_HEADER') !== null,
    isSubagentBadgeVisible: (): boolean =>
      screen.getByTestId('TOOL_GROUP_HEADER').textContent?.includes('SUB-AGENT') ?? false,
    hasMessageCount: ({ count }: { count: number }): boolean =>
      screen.queryAllByTestId('CHAT_MESSAGE').length === count,
  };
};
