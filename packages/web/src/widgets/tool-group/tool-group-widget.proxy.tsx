import { screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

import { ChatMessageWidgetProxy } from '../chat-message/chat-message-widget.proxy';
import { ToolRowWidgetProxy } from '../tool-row/tool-row-widget.proxy';

export const ToolGroupWidgetProxy = (): {
  clickHeader: () => Promise<void>;
  isHeaderVisible: () => boolean;
  isSubagentBadgeVisible: () => boolean;
  hasEntryCount: (params: { count: number }) => boolean;
  expandAllToolRows: () => Promise<void>;
} => {
  ChatMessageWidgetProxy();
  ToolRowWidgetProxy();

  return {
    clickHeader: async (): Promise<void> => {
      await userEvent.click(screen.getByTestId('TOOL_GROUP_HEADER'));
    },
    isHeaderVisible: (): boolean => screen.queryByTestId('TOOL_GROUP_HEADER') !== null,
    isSubagentBadgeVisible: (): boolean =>
      screen.getByTestId('TOOL_GROUP_HEADER').textContent?.includes('SUB-AGENT') ?? false,
    hasEntryCount: ({ count }: { count: number }): boolean => {
      const toolRows = screen.queryAllByTestId('TOOL_ROW').length;
      const chatMessages = screen.queryAllByTestId('CHAT_MESSAGE').length;
      return toolRows + chatMessages === count;
    },
    expandAllToolRows: async (): Promise<void> => {
      const headers = screen.queryAllByTestId('TOOL_ROW_HEADER');
      await Promise.all(headers.map(async (header) => userEvent.click(header)));
    },
  };
};
