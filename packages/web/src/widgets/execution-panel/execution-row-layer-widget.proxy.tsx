import { screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

import { ChatEntryListWidgetProxy } from '../chat-entry-list/chat-entry-list-widget.proxy';
import { ExecutionRowMintedByBadgeLayerWidgetProxy } from './execution-row-minted-by-badge-layer-widget.proxy';
import { ExecutionRowScopeChurnLayerWidgetProxy } from './execution-row-scope-churn-layer-widget.proxy';
import { ExecutionRowUnitMarksLayerWidgetProxy } from './execution-row-unit-marks-layer-widget.proxy';
import { ExecutionRowUnmetListLayerWidgetProxy } from './execution-row-unmet-list-layer-widget.proxy';
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
  // Both are pure/self-contained (no I/O), so their proxies are no-ops — created only to satisfy
  // enforce-proxy-child-creation, matching the pattern above.
  ExecutionRowMintedByBadgeLayerWidgetProxy();
  ExecutionRowUnmetListLayerWidgetProxy();
  ExecutionRowUnitMarksLayerWidgetProxy();
  ExecutionRowScopeChurnLayerWidgetProxy();

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
