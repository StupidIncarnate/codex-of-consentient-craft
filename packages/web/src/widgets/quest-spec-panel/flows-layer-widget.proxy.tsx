import { screen } from '#gateway/npm/testing-library__react';
import userEvent from '#gateway/npm/testing-library__user-event';

import type { Quest } from '@dungeonmaster/shared/contracts';

import type { CommentQueueEntryStub } from '../../contracts/comment-queue-entry/comment-queue-entry.stub';
import { ReactFlowDiagramWidgetProxy } from '../react-flow-diagram/react-flow-diagram-widget.proxy';
import { SectionHeaderWidgetProxy } from '../section-header/section-header-widget.proxy';
import { FlowTabLayerWidgetProxy } from './flow-tab-layer-widget.proxy';

import { userEventStatics } from '../../statics/user-event/user-event-statics';

type ReactFlowProxy = ReturnType<typeof ReactFlowDiagramWidgetProxy>;
type SetupPositionsArgs = Parameters<ReactFlowProxy['setupPositions']>[0];
type QueuedEntry = ReturnType<typeof CommentQueueEntryStub>;

export const FlowsLayerWidgetProxy = (): {
  setupPositions: (args: SetupPositionsArgs) => void;
  setupEmptyQueue: () => void;
  setupQueuedComments: (params: { questId: Quest['id']; entries: QueuedEntry[] }) => void;
  clickNode: ReactFlowProxy['clickNode'];
  clickObservableNode: ReactFlowProxy['clickObservableNode'];
  getCommentBadgeTextsOn: ReactFlowProxy['getCommentBadgeTextsOn'];
  countCommentButtonsOn: ReactFlowProxy['countCommentButtonsOn'];
  countCardsOn: ReactFlowProxy['countCardsOn'];
  hasCommentsSection: () => boolean;
  getPanelCommentTexts: () => Node['textContent'][];
  clickTab: (params: { index: number }) => Promise<void>;
  getTabLabels: () => Node['textContent'][];
  getMarkedTabLabels: () => Node['textContent'][];
  countTabQueueMarks: () => HTMLElement['childElementCount'];
  tabQueueMarkGlyphs: () => HTMLElement['className'][];
} => {
  SectionHeaderWidgetProxy();
  const reactFlowProxy = ReactFlowDiagramWidgetProxy();
  const tabProxy = FlowTabLayerWidgetProxy();
  const user = userEvent.setup(userEventStatics.options);

  return {
    setupPositions: (args: SetupPositionsArgs): void => {
      reactFlowProxy.setupPositions(args);
    },
    setupEmptyQueue: (): void => {
      reactFlowProxy.setupEmptyQueue();
      tabProxy.setupEmptyQueue();
    },
    setupQueuedComments: ({
      questId,
      entries,
    }: {
      questId: Quest['id'];
      entries: QueuedEntry[];
    }): void => {
      tabProxy.setupQueuedComments({ questId, entries });
    },
    clickNode: reactFlowProxy.clickNode,
    clickObservableNode: reactFlowProxy.clickObservableNode,
    getCommentBadgeTextsOn: reactFlowProxy.getCommentBadgeTextsOn,
    countCommentButtonsOn: reactFlowProxy.countCommentButtonsOn,
    countCardsOn: reactFlowProxy.countCardsOn,
    hasCommentsSection: (): boolean => reactFlowProxy.hasCommentsSection(),
    getPanelCommentTexts: (): Node['textContent'][] => reactFlowProxy.getPanelCommentTexts(),

    // Addressed by position: every tab in the row shares one testid, so the index is what names
    // which flow the reader switched to.
    clickTab: async ({ index }: { index: number }): Promise<void> => {
      const tab = screen.getAllByTestId('FLOW_TAB')[index];
      if (tab === undefined) {
        throw new Error(`no FLOW_TAB was rendered at index ${String(index)}`);
      }
      await user.click(tab);
    },
    getTabLabels: (): Node['textContent'][] =>
      screen.queryAllByTestId('FLOW_TAB').map((tab) => tab.textContent),

    // WHICH tabs carry the mark, named by their label rather than counted. A count alone passes on
    // a rule that marks the wrong tab, and every tab in the row shares one testid.
    getMarkedTabLabels: (): Node['textContent'][] =>
      screen
        .queryAllByTestId('FLOW_TAB')
        .filter((tab) => tab.querySelector('[data-testid="FLOW_TAB_QUEUE_MARK"]') !== null)
        .map((tab) => tab.textContent),
    countTabQueueMarks: (): HTMLElement['childElementCount'] => tabProxy.countMarks(),
    tabQueueMarkGlyphs: (): HTMLElement['className'][] => tabProxy.markGlyphs(),
  };
};
