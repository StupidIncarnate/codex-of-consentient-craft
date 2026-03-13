import { screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

import { PixelBtnWidgetProxy } from '../pixel-btn/pixel-btn-widget.proxy';
import { QuestSpecPanelWidgetProxy } from '../quest-spec-panel/quest-spec-panel-widget.proxy';
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
  getStepRows: () => HTMLElement[];
  getFloorHeaders: () => HTMLElement[];
  getActionButtons: () => HTMLElement[];
  clickButtonByLabel: (params: { label: string }) => Promise<void>;
  hasPlanningText: () => boolean;
  hasStreamingBar: () => boolean;
  getExecutionMessages: () => HTMLElement[];
} => {
  ExecutionRowLayerWidgetProxy();
  ExecutionStatusBarLayerWidgetProxy();
  FloorHeaderLayerWidgetProxy();
  PixelBtnWidgetProxy();
  QuestSpecPanelWidgetProxy();

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
    getStepRows: (): HTMLElement[] => screen.queryAllByTestId('execution-row-layer-widget'),
    getFloorHeaders: (): HTMLElement[] => screen.queryAllByTestId('floor-header-layer-widget'),
    getActionButtons: (): HTMLElement[] => {
      const actionBar = screen.queryByTestId('execution-panel-action-bar');
      if (!actionBar) {
        return [];
      }
      return Array.from(actionBar.querySelectorAll('[data-testid="PIXEL_BTN"]'));
    },
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
    hasPlanningText: (): boolean => screen.queryByTestId('execution-panel-planning-text') !== null,
    hasStreamingBar: (): boolean => screen.queryByTestId('streaming-bar-layer-widget') !== null,
    getExecutionMessages: (): HTMLElement[] => screen.queryAllByTestId('CHAT_MESSAGE'),
  };
};
