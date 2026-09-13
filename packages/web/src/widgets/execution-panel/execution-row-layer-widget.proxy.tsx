import { screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

import { ChatEntryListWidgetProxy } from '../chat-entry-list/chat-entry-list-widget.proxy';
import { RiftcarverResultRowLayerWidgetProxy } from './riftcarver-result-row-layer-widget.proxy';
import { StreamingBarLayerWidgetProxy } from './streaming-bar-layer-widget.proxy';
import { WardResultRowLayerWidgetProxy } from './ward-result-row-layer-widget.proxy';

import { userEventStatics } from '../../statics/user-event/user-event-statics';

export const ExecutionRowLayerWidgetProxy = (): {
  clickShowEarlier: () => Promise<void>;
  hasShowEarlierToggle: () => boolean;
} => {
  ChatEntryListWidgetProxy();
  StreamingBarLayerWidgetProxy();
  // The row renders WardResultRowLayerWidget for ward rows; create its proxy so the
  // ward-detail HTTP endpoint is mocked (no-op for non-ward rows that never fetch).
  WardResultRowLayerWidgetProxy();
  // Same reasoning for riftcarver rows and the riftcarver-detail endpoint.
  RiftcarverResultRowLayerWidgetProxy();

  return {
    clickShowEarlier: async (): Promise<void> => {
      await userEvent.click(
        screen.getByTestId('CHAT_LIST_SHOW_EARLIER_TOGGLE'),
        userEventStatics.options,
      );
    },
    hasShowEarlierToggle: (): boolean =>
      screen.queryByTestId('CHAT_LIST_SHOW_EARLIER_TOGGLE') !== null,
  };
};
