import { screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

import { ChatEntryListWidgetProxy } from '../chat-entry-list/chat-entry-list-widget.proxy';
import { StreamingBarLayerWidgetProxy } from './streaming-bar-layer-widget.proxy';

export const ExecutionRowLayerWidgetProxy = (): {
  clickShowEarlier: () => Promise<void>;
  hasShowEarlierToggle: () => boolean;
} => {
  ChatEntryListWidgetProxy();
  StreamingBarLayerWidgetProxy();

  return {
    clickShowEarlier: async (): Promise<void> => {
      await userEvent.click(screen.getByTestId('CHAT_LIST_SHOW_EARLIER_TOGGLE'));
    },
    hasShowEarlierToggle: (): boolean =>
      screen.queryByTestId('CHAT_LIST_SHOW_EARLIER_TOGGLE') !== null,
  };
};
