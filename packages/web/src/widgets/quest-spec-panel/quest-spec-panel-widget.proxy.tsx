import { screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

import { CommentBatchSendResultStub } from '../../contracts/comment-batch-send-result/comment-batch-send-result.stub';
import { CommentQueueBarWidgetProxy } from '../comment-queue-bar/comment-queue-bar-widget.proxy';
import { OperationsLedgerWidgetProxy } from '../operations-ledger/operations-ledger-widget.proxy';
import { PixelBtnWidgetProxy } from '../pixel-btn/pixel-btn-widget.proxy';
import { QuestClarifyPanelWidgetProxy } from '../quest-clarify-panel/quest-clarify-panel-widget.proxy';
import { QuestTitleBarWidgetProxy } from '../quest-title-bar/quest-title-bar-widget.proxy';
import { ContractsLayerWidgetProxy } from './contracts-layer-widget.proxy';
import { DesignDecisionsLayerWidgetProxy } from './design-decisions-layer-widget.proxy';
import { FlowsLayerWidgetProxy } from './flows-layer-widget.proxy';

type FlowsProxy = ReturnType<typeof FlowsLayerWidgetProxy>;
type SetupPositionsArgs = Parameters<FlowsProxy['setupPositions']>[0];
type QueueBarProxy = ReturnType<typeof CommentQueueBarWidgetProxy>;
type SetupQueuedCommentsArgs = Parameters<QueueBarProxy['setupQueuedComments']>[0];
type QueuedEntry = SetupQueuedCommentsArgs['entries'][0];
type SendResult = ReturnType<typeof CommentBatchSendResultStub>;

export const QuestSpecPanelWidgetProxy = (): {
  setupPositions: (args: SetupPositionsArgs) => void;
  setupEmptyQueue: () => void;
  setupQueuedComments: (args: SetupQueuedCommentsArgs) => void;
  hasQueueBar: () => boolean;
  getQueueBarCountText: () => HTMLElement['textContent'];
  isQueueBarPreviousSiblingOfActionBar: () => boolean;
  clickNode: FlowsProxy['clickNode'];
  clickObservableNode: FlowsProxy['clickObservableNode'];
  getCommentBadgeTextsOn: FlowsProxy['getCommentBadgeTextsOn'];
  hasCommentsSection: () => boolean;
  getPanelCommentTexts: () => HTMLElement['textContent'][];
  clickApprove: () => Promise<void>;
  clickAbandon: () => Promise<void>;
  clickConfirmAbandon: () => Promise<void>;
  clickCancelAbandon: () => Promise<void>;
  clickQueueSend: () => Promise<void>;
  hasClarifyPanel: () => boolean;
  hasActionButtons: () => boolean;
  hasAbandonButton: () => boolean;
  hasOperationsSection: () => boolean;
  getOperationsLedgerRows: () => HTMLElement[];
  getActionBarButtonLabels: () => HTMLElement['textContent'][];
  countCommentButtons: () => HTMLElement['childElementCount'];
  // Fresh jest.fn() per proxy instance (Create-Per-Test Pattern) — a single shared double for the
  // widget's onSendComments prop so ~60 render sites don't each hand-roll an inline arrow.
  // Resolves 'sent' by default; tests that need the wiring itself assert calls directly on this.
  onSendComments: (params: { comments: readonly QueuedEntry[] }) => Promise<SendResult>;
} => {
  PixelBtnWidgetProxy();
  QuestClarifyPanelWidgetProxy();
  QuestTitleBarWidgetProxy();
  ContractsLayerWidgetProxy();
  DesignDecisionsLayerWidgetProxy();
  const flowsProxy = FlowsLayerWidgetProxy();
  const queueBarProxy = CommentQueueBarWidgetProxy();

  const ledgerProxy = OperationsLedgerWidgetProxy();
  const onSendComments = jest.fn(async () => Promise.resolve(CommentBatchSendResultStub()));

  return {
    setupPositions: (args: SetupPositionsArgs): void => {
      flowsProxy.setupPositions(args);
    },
    setupEmptyQueue: (): void => {
      queueBarProxy.setupEmptyQueue();
    },
    setupQueuedComments: (args: SetupQueuedCommentsArgs): void => {
      queueBarProxy.setupQueuedComments(args);
    },
    hasQueueBar: (): boolean => queueBarProxy.hasBar(),
    getQueueBarCountText: (): HTMLElement['textContent'] => queueBarProxy.getCountText(),
    clickQueueSend: async (): Promise<void> => queueBarProxy.clickSend(),
    onSendComments,
    // The bar must be the ACTION_BAR's IMMEDIATE previous sibling: anywhere inside the scrollable
    // content box it would scroll away, which is the one thing the pinning requirement rules out.
    isQueueBarPreviousSiblingOfActionBar: (): boolean =>
      screen.queryByTestId('ACTION_BAR')?.previousElementSibling?.getAttribute('data-testid') ===
      'COMMENT_QUEUE_BAR',
    clickNode: flowsProxy.clickNode,
    clickObservableNode: flowsProxy.clickObservableNode,
    getCommentBadgeTextsOn: flowsProxy.getCommentBadgeTextsOn,
    hasCommentsSection: (): boolean => flowsProxy.hasCommentsSection(),
    getPanelCommentTexts: (): HTMLElement['textContent'][] => flowsProxy.getPanelCommentTexts(),
    clickApprove: async (): Promise<void> => {
      const buttons = screen.getAllByTestId('PIXEL_BTN');
      const approveButton = buttons.find((button) => button.textContent === 'APPROVE');
      if (approveButton) {
        await userEvent.click(approveButton);
      }
    },
    clickAbandon: async (): Promise<void> => {
      const abandonBar = screen.queryByTestId('ABANDON_BAR');
      if (abandonBar) {
        const buttons = abandonBar.querySelectorAll('[data-testid="PIXEL_BTN"]');
        const abandonButton = Array.from(buttons).find(
          (button) => button.textContent === 'ABANDON QUEST',
        );
        if (abandonButton) {
          await userEvent.click(abandonButton);
        }
      }
    },
    clickConfirmAbandon: async (): Promise<void> => {
      const abandonBar = screen.queryByTestId('ABANDON_BAR');
      if (abandonBar) {
        const buttons = abandonBar.querySelectorAll('[data-testid="PIXEL_BTN"]');
        const confirmButton = Array.from(buttons).find(
          (button) => button.textContent === 'CONFIRM ABANDON',
        );
        if (confirmButton) {
          await userEvent.click(confirmButton);
        }
      }
    },
    clickCancelAbandon: async (): Promise<void> => {
      const abandonBar = screen.queryByTestId('ABANDON_BAR');
      if (abandonBar) {
        const buttons = abandonBar.querySelectorAll('[data-testid="PIXEL_BTN"]');
        const cancelButton = Array.from(buttons).find((button) => button.textContent === 'CANCEL');
        if (cancelButton) {
          await userEvent.click(cancelButton);
        }
      }
    },
    hasClarifyPanel: (): boolean => screen.queryByTestId('QUEST_CLARIFY_PANEL') !== null,
    hasActionButtons: (): boolean => {
      const actionBar = screen.queryByTestId('ACTION_BAR');
      if (!actionBar) return false;
      return actionBar.querySelectorAll('[data-testid="PIXEL_BTN"]').length > 0;
    },
    hasAbandonButton: (): boolean => {
      const abandonBar = screen.queryByTestId('ABANDON_BAR');
      if (!abandonBar) return false;
      const buttons = abandonBar.querySelectorAll('[data-testid="PIXEL_BTN"]');
      return Array.from(buttons).some((button) => button.textContent === 'ABANDON QUEST');
    },
    countCommentButtons: (): HTMLElement['childElementCount'] =>
      screen.queryAllByTestId('COMMENT_BUTTON').length,
    hasOperationsSection: (): boolean => screen.queryByTestId('OPERATIONS_SECTION') !== null,
    getOperationsLedgerRows: (): HTMLElement[] => ledgerProxy.getLedgerRows(),
    getActionBarButtonLabels: (): HTMLElement['textContent'][] => {
      const actionBar = screen.queryByTestId('ACTION_BAR');
      if (!actionBar) return [];
      return Array.from(actionBar.querySelectorAll('[data-testid="PIXEL_BTN"]')).map(
        (button) => button.textContent,
      );
    },
  };
};
