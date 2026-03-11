import { screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

import { AgentOutputPanelWidgetProxy } from '../agent-output-panel/agent-output-panel-widget.proxy';
import { ExecutionRowLayerWidgetProxy } from './execution-row-layer-widget.proxy';
import { ExecutionStatusBarLayerWidgetProxy } from './execution-status-bar-layer-widget.proxy';
import { FloorHeaderLayerWidgetProxy } from './floor-header-layer-widget.proxy';
import { QuestSpecPanelWidgetProxy } from '../quest-spec-panel/quest-spec-panel-widget.proxy';

export const ExecutionPanelWidgetProxy = (): {
  clickTab: (params: { tabId: 'execution' | 'spec' }) => Promise<void>;
  hasTabBar: () => boolean;
  hasStatusBar: () => boolean;
  hasFloorContent: () => boolean;
  hasSpecPanel: () => boolean;
  getStepRows: () => HTMLElement[];
  getFloorHeaders: () => HTMLElement[];
} => {
  AgentOutputPanelWidgetProxy();
  ExecutionRowLayerWidgetProxy();
  ExecutionStatusBarLayerWidgetProxy();
  FloorHeaderLayerWidgetProxy();
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
    getStepRows: (): HTMLElement[] => screen.queryAllByTestId('execution-row-layer-widget'),
    getFloorHeaders: (): HTMLElement[] => screen.queryAllByTestId('floor-header-layer-widget'),
  };
};
