import { screen } from '@testing-library/react';

import type { QuestId } from '@dungeonmaster/shared/contracts';

import { useCommentQueueBindingProxy } from '../../bindings/use-comment-queue/use-comment-queue-binding.proxy';
import type { CommentQueueEntryStub } from '../../contracts/comment-queue-entry/comment-queue-entry.stub';

type QueuedEntry = ReturnType<typeof CommentQueueEntryStub>;

export const FlowTabQueueMarkLayerWidgetProxy = (): {
  setupEmptyQueue: () => void;
  setupQueuedComments: (params: { questId: QuestId; entries: QueuedEntry[] }) => void;
  countMarks: () => HTMLElement['childElementCount'];
  markGlyphs: () => HTMLElement['className'][];
  markColor: () => HTMLElement['style']['color'];
} => {
  const queueProxy = useCommentQueueBindingProxy();

  return {
    setupEmptyQueue: (): void => {
      queueProxy.setupEmptyQueue();
    },
    setupQueuedComments: ({
      questId,
      entries,
    }: {
      questId: QuestId;
      entries: QueuedEntry[];
    }): void => {
      queueProxy.setupQueuedComments({ questId, entries });
    },

    countMarks: (): HTMLElement['childElementCount'] =>
      screen.queryAllByTestId('FLOW_TAB_QUEUE_MARK').length,

    // Which glyph each mark paints, in render order. The tabler mock stamps every icon's component
    // name as its testid, so the name is the whole jsdom-visible difference between the filled
    // bubble this is supposed to be and the hollow one that would read as "nothing owed".
    markGlyphs: (): HTMLElement['className'][] =>
      screen
        .queryAllByTestId('FLOW_TAB_QUEUE_MARK')
        .map(
          (mark) => mark.querySelector('[data-testid^="Icon"]')?.getAttribute('data-testid') ?? '',
        ),

    markColor: (): HTMLElement['style']['color'] =>
      screen.getByTestId('FLOW_TAB_QUEUE_MARK').style.color,
  };
};
