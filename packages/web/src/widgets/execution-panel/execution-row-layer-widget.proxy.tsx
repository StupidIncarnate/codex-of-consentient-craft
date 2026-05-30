import { screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

import { ChatEntryListWidgetProxy } from '../chat-entry-list/chat-entry-list-widget.proxy';
import { StreamingBarLayerWidgetProxy } from './streaming-bar-layer-widget.proxy';
import { WardResultDetailLayerWidgetProxy } from './ward-result-detail-layer-widget.proxy';

export const ExecutionRowLayerWidgetProxy = (): {
  clickShowEarlier: () => Promise<void>;
  hasShowEarlierToggle: () => boolean;
} => {
  ChatEntryListWidgetProxy();
  StreamingBarLayerWidgetProxy();
  // The row renders WardResultDetailLayerWidget for ward rows; create its proxy so the
  // ward-detail HTTP endpoint is mocked (no-op for non-ward rows that never fetch).
  WardResultDetailLayerWidgetProxy();

  return {
    clickShowEarlier: async (): Promise<void> => {
      await userEvent.click(screen.getByTestId('CHAT_LIST_SHOW_EARLIER_TOGGLE'));
    },
    hasShowEarlierToggle: (): boolean =>
      screen.queryByTestId('CHAT_LIST_SHOW_EARLIER_TOGGLE') !== null,
  };
};
