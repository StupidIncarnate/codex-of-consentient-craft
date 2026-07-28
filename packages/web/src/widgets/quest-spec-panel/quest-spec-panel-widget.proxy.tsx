import { screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

import { OperationsLedgerWidgetProxy } from '../operations-ledger/operations-ledger-widget.proxy';
import { PixelBtnWidgetProxy } from '../pixel-btn/pixel-btn-widget.proxy';
import { QuestClarifyPanelWidgetProxy } from '../quest-clarify-panel/quest-clarify-panel-widget.proxy';
import { QuestTitleBarWidgetProxy } from '../quest-title-bar/quest-title-bar-widget.proxy';
import { ContractsLayerWidgetProxy } from './contracts-layer-widget.proxy';
import { DesignDecisionsLayerWidgetProxy } from './design-decisions-layer-widget.proxy';
import { FlowsLayerWidgetProxy } from './flows-layer-widget.proxy';

export const QuestSpecPanelWidgetProxy = (): {
  clickApprove: () => Promise<void>;
  clickAbandon: () => Promise<void>;
  clickConfirmAbandon: () => Promise<void>;
  clickCancelAbandon: () => Promise<void>;
  hasClarifyPanel: () => boolean;
  hasActionButtons: () => boolean;
  hasAbandonButton: () => boolean;
  hasOperationsSection: () => boolean;
  getOperationsLedgerRows: () => HTMLElement[];
  getActionBarButtonLabels: () => HTMLElement['textContent'][];
} => {
  PixelBtnWidgetProxy();
  QuestClarifyPanelWidgetProxy();
  QuestTitleBarWidgetProxy();
  ContractsLayerWidgetProxy();
  DesignDecisionsLayerWidgetProxy();
  FlowsLayerWidgetProxy();

  const ledgerProxy = OperationsLedgerWidgetProxy();

  return {
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
