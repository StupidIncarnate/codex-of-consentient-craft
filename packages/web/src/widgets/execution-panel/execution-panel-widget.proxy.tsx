import { screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

import { AutoScrollContainerWidgetProxy } from '../auto-scroll-container/auto-scroll-container-widget.proxy';
import { PixelBtnWidgetProxy } from '../pixel-btn/pixel-btn-widget.proxy';
import { QuestSpecPanelWidgetProxy } from '../quest-spec-panel/quest-spec-panel-widget.proxy';
import { QuestTitleBarWidgetProxy } from '../quest-title-bar/quest-title-bar-widget.proxy';
import { ExecutionRowLayerWidgetProxy } from './execution-row-layer-widget.proxy';
import { ExecutionStatusBarLayerWidgetProxy } from './execution-status-bar-layer-widget.proxy';
import { FloorHeaderLayerWidgetProxy } from './floor-header-layer-widget.proxy';

export const ExecutionPanelWidgetProxy = (): {
  clickTab: (params: { tabId: 'execution' | 'spec' }) => Promise<void>;
  hasTabBar: () => boolean;
  hasStatusBar: () => boolean;
  hasFloorContent: () => boolean;
  hasSpecPanel: () => boolean;
  hasActionBar: () => boolean;
  hasAbandonButton: () => boolean;
  getStepRows: () => HTMLElement[];
  getFloorHeaders: () => HTMLElement[];
  getActionButtons: () => HTMLElement[];
  getAbandonButtons: () => HTMLElement[];
  clickButtonByLabel: (params: { label: string }) => Promise<void>;
  clickAbandon: () => Promise<void>;
  clickConfirmAbandon: () => Promise<void>;
  clickCancelAbandon: () => Promise<void>;
  hasPlanningText: () => boolean;
  hasStreamingBar: () => boolean;
  getExecutionMessages: () => HTMLElement[];
  hasPauseButton: () => boolean;
  hasResumeButton: () => boolean;
  clickPauseButton: () => Promise<void>;
  clickResumeButton: () => Promise<void>;
} => {
  AutoScrollContainerWidgetProxy();
  ExecutionRowLayerWidgetProxy();
  ExecutionStatusBarLayerWidgetProxy();
  FloorHeaderLayerWidgetProxy();
  PixelBtnWidgetProxy();
  QuestSpecPanelWidgetProxy();
  QuestTitleBarWidgetProxy();

  const getAbandonBarButtons = (): HTMLElement[] => {
    const abandonBar = screen.queryByTestId('ABANDON_BAR');
    if (!abandonBar) {
      return [];
    }
    return Array.from(abandonBar.querySelectorAll('[data-testid="PIXEL_BTN"]'));
  };

  const clickAbandonBarButton = async ({ label }: { label: string }): Promise<void> => {
    const target = getAbandonBarButtons().find((btn) => btn.textContent === label);
    if (target) {
      await userEvent.click(target);
    }
  };

  return {
    clickTab: async ({ tabId }: { tabId: 'execution' | 'spec' }): Promise<void> => {
      const tab = screen.queryByTestId(`execution-panel-tab-${tabId}`);
      if (tab) {
        await userEvent.click(tab);
      }
    },
    hasTabBar: (): boolean => screen.queryByTestId('execution-panel-tab-bar') !== null,
    hasStatusBar: (): boolean => screen.queryByTestId('execution-status-bar-layer-widget') !== null,
    hasFloorContent: (): boolean => screen.queryByTestId('execution-panel-floor-content') !== null,
    hasSpecPanel: (): boolean => screen.queryByTestId('QUEST_SPEC_PANEL') !== null,
    hasActionBar: (): boolean => screen.queryByTestId('execution-panel-action-bar') !== null,
    hasAbandonButton: (): boolean =>
      getAbandonBarButtons().some((btn) => btn.textContent === 'ABANDON QUEST'),
    getStepRows: (): HTMLElement[] => screen.queryAllByTestId('execution-row-layer-widget'),
    getFloorHeaders: (): HTMLElement[] => screen.queryAllByTestId('floor-header-layer-widget'),
    getActionButtons: (): HTMLElement[] => {
      const actionBar = screen.queryByTestId('execution-panel-action-bar');
      if (!actionBar) {
        return [];
      }
      return Array.from(actionBar.querySelectorAll('[data-testid="PIXEL_BTN"]'));
    },
    getAbandonButtons: (): HTMLElement[] => getAbandonBarButtons(),
    clickButtonByLabel: async ({ label }: { label: string }): Promise<void> => {
      const actionBar = screen.queryByTestId('execution-panel-action-bar');
      if (!actionBar) {
        return;
      }
      const buttons = Array.from(actionBar.querySelectorAll('[data-testid="PIXEL_BTN"]'));
      const target = buttons.find((btn) => btn.textContent === label);
      if (target) {
        await userEvent.click(target);
      }
    },
    clickAbandon: async (): Promise<void> => {
      await clickAbandonBarButton({ label: 'ABANDON QUEST' });
    },
    clickConfirmAbandon: async (): Promise<void> => {
      await clickAbandonBarButton({ label: 'CONFIRM ABANDON' });
    },
    clickCancelAbandon: async (): Promise<void> => {
      await clickAbandonBarButton({ label: 'CANCEL' });
    },
    hasPlanningText: (): boolean => screen.queryByTestId('execution-panel-planning-text') !== null,
    hasStreamingBar: (): boolean => screen.queryByTestId('streaming-bar-layer-widget') !== null,
    getExecutionMessages: (): HTMLElement[] => screen.queryAllByTestId('CHAT_MESSAGE'),
    hasPauseButton: (): boolean => screen.queryByTestId('EXECUTION_PAUSE_BUTTON') !== null,
    hasResumeButton: (): boolean => screen.queryByTestId('EXECUTION_RESUME_BUTTON') !== null,
    clickPauseButton: async (): Promise<void> => {
      const container = screen.queryByTestId('EXECUTION_PAUSE_BUTTON');
      if (!container) {
        return;
      }
      const btn = container.querySelector('[data-testid="PIXEL_BTN"]');
      if (btn) {
        await userEvent.click(btn);
      }
    },
    clickResumeButton: async (): Promise<void> => {
      const container = screen.queryByTestId('EXECUTION_RESUME_BUTTON');
      if (!container) {
        return;
      }
      const btn = container.querySelector('[data-testid="PIXEL_BTN"]');
      if (btn) {
        await userEvent.click(btn);
      }
    },
  };
};
