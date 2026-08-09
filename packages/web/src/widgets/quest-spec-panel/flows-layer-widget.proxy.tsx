import { screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

import type { QuestId } from '@dungeonmaster/shared/contracts';

import type { CommentQueueEntryStub } from '../../contracts/comment-queue-entry/comment-queue-entry.stub';
import { ReactFlowDiagramWidgetProxy } from '../react-flow-diagram/react-flow-diagram-widget.proxy';
import { SectionHeaderWidgetProxy } from '../section-header/section-header-widget.proxy';
import { FlowTabQueueMarkLayerWidgetProxy } from './flow-tab-queue-mark-layer-widget.proxy';

type ReactFlowProxy = ReturnType<typeof ReactFlowDiagramWidgetProxy>;
type SetupPositionsArgs = Parameters<ReactFlowProxy['setupPositions']>[0];
type QueuedEntry = ReturnType<typeof CommentQueueEntryStub>;

export const FlowsLayerWidgetProxy = (): {
  setupPositions: (args: SetupPositionsArgs) => void;
  setupEmptyQueue: () => void;
  setupQueuedComments: (params: { questId: QuestId; entries: QueuedEntry[] }) => void;
  clickNode: ReactFlowProxy['clickNode'];
  clickObservableNode: ReactFlowProxy['clickObservableNode'];
  getCommentBadgeTextsOn: ReactFlowProxy['getCommentBadgeTextsOn'];
  countCommentButtonsOn: ReactFlowProxy['countCommentButtonsOn'];
  countCardsOn: ReactFlowProxy['countCardsOn'];
  hasCommentsSection: () => boolean;
  getPanelCommentTexts: () => HTMLElement['textContent'][];
  clickTab: (params: { index: number }) => Promise<void>;
  getTabLabels: () => HTMLElement['textContent'][];
  getMarkedTabLabels: () => HTMLElement['textContent'][];
  countTabQueueMarks: () => HTMLElement['childElementCount'];
  tabQueueMarkGlyphs: () => HTMLElement['className'][];
} => {
  SectionHeaderWidgetProxy();
  const reactFlowProxy = ReactFlowDiagramWidgetProxy();
  const tabMarkProxy = FlowTabQueueMarkLayerWidgetProxy();
  const user = userEvent.setup();

  return {
    setupPositions: (args: SetupPositionsArgs): void => {
      reactFlowProxy.setupPositions(args);
    },
    setupEmptyQueue: (): void => {
      reactFlowProxy.setupEmptyQueue();
    },
    setupQueuedComments: ({
      questId,
      entries,
    }: {
      questId: QuestId;
      entries: QueuedEntry[];
    }): void => {
      tabMarkProxy.setupQueuedComments({ questId, entries });
    },
    clickNode: reactFlowProxy.clickNode,
    clickObservableNode: reactFlowProxy.clickObservableNode,
    getCommentBadgeTextsOn: reactFlowProxy.getCommentBadgeTextsOn,
    countCommentButtonsOn: reactFlowProxy.countCommentButtonsOn,
    countCardsOn: reactFlowProxy.countCardsOn,
    hasCommentsSection: (): boolean => reactFlowProxy.hasCommentsSection(),
    getPanelCommentTexts: (): HTMLElement['textContent'][] => reactFlowProxy.getPanelCommentTexts(),

    // Addressed by position: every tab in the row shares one testid, so the index is what names
    // which flow the reader switched to.
    clickTab: async ({ index }: { index: number }): Promise<void> => {
      const tab = screen.getAllByTestId('FLOW_TAB')[index];
      if (tab === undefined) {
        throw new Error(`no FLOW_TAB was rendered at index ${String(index)}`);
      }
      await user.click(tab);
    },
    getTabLabels: (): HTMLElement['textContent'][] =>
      screen.queryAllByTestId('FLOW_TAB').map((tab) => tab.textContent),

    // WHICH tabs carry the mark, named by their label rather than counted. A count alone passes on
    // a rule that marks the wrong tab, and every tab in the row shares one testid.
    getMarkedTabLabels: (): HTMLElement['textContent'][] =>
      screen
        .queryAllByTestId('FLOW_TAB')
        .filter((tab) => tab.querySelector('[data-testid="FLOW_TAB_QUEUE_MARK"]') !== null)
        .map((tab) => tab.textContent),
    countTabQueueMarks: (): HTMLElement['childElementCount'] => tabMarkProxy.countMarks(),
    tabQueueMarkGlyphs: (): HTMLElement['className'][] => tabMarkProxy.markGlyphs(),
  };
};
