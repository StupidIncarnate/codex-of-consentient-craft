import { screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

import type { QuestId } from '@dungeonmaster/shared/contracts';

import type { CommentQueueEntryStub } from '../../contracts/comment-queue-entry/comment-queue-entry.stub';
import { userEventStatics } from '../../statics/user-event/user-event-statics';
import { FlowTabQueueMarkLayerWidgetProxy } from './flow-tab-queue-mark-layer-widget.proxy';

type QueuedEntry = ReturnType<typeof CommentQueueEntryStub>;

export const FlowTabLayerWidgetProxy = (): {
  setupEmptyQueue: () => void;
  setupQueuedComments: (params: { questId: QuestId; entries: QueuedEntry[] }) => void;
  clickTab: () => Promise<void>;
  getLabel: () => HTMLElement['textContent'];
  isActive: () => boolean;
  countMarks: () => HTMLElement['childElementCount'];
  markGlyphs: () => HTMLElement['className'][];
} => {
  const queueMarkProxy = FlowTabQueueMarkLayerWidgetProxy();
  const user = userEvent.setup(userEventStatics.options);

  return {
    setupEmptyQueue: (): void => {
      queueMarkProxy.setupEmptyQueue();
    },
    setupQueuedComments: ({
      questId,
      entries,
    }: {
      questId: QuestId;
      entries: QueuedEntry[];
    }): void => {
      queueMarkProxy.setupQueuedComments({ questId, entries });
    },

    clickTab: async (): Promise<void> => {
      await user.click(screen.getByTestId('FLOW_TAB'));
    },
    getLabel: (): HTMLElement['textContent'] => screen.getByTestId('FLOW_TAB_LABEL').textContent,
    isActive: (): boolean => screen.getByTestId('FLOW_TAB').getAttribute('data-active') === 'true',
    countMarks: (): HTMLElement['childElementCount'] => queueMarkProxy.countMarks(),
    markGlyphs: (): HTMLElement['className'][] => queueMarkProxy.markGlyphs(),
  };
};
