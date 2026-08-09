import { screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

import { AutoScrollContainerWidgetProxy } from '../auto-scroll-container/auto-scroll-container-widget.proxy';
import { ChatPanelWidgetProxy } from '../chat-panel/chat-panel-widget.proxy';
import { DumpsterCommandBannerWidgetProxy } from '../dumpster-command-banner/dumpster-command-banner-widget.proxy';
import { OperationsLedgerWidgetProxy } from '../operations-ledger/operations-ledger-widget.proxy';
import { PixelBtnWidgetProxy } from '../pixel-btn/pixel-btn-widget.proxy';
import { QuestSpecPanelWidgetProxy } from '../quest-spec-panel/quest-spec-panel-widget.proxy';
import { QuestTitleBarWidgetProxy } from '../quest-title-bar/quest-title-bar-widget.proxy';
import { ExecutionRowLayerWidgetProxy } from './execution-row-layer-widget.proxy';
import { ExecutionStatusBarLayerWidgetProxy } from './execution-status-bar-layer-widget.proxy';

export const ExecutionPanelWidgetProxy = (): {
  clickTab: (params: { tabId: 'followup' | 'execution' | 'spec' }) => Promise<void>;
  hasTabBar: () => boolean;
  getTabLabels: () => (HTMLElement['textContent'] | null)[];
  hasStatusBar: () => boolean;
  hasFloorContent: () => boolean;
  hasSpecPanel: () => boolean;
  hasActionBar: () => boolean;
  hasAbandonButton: () => boolean;
  hasDumpsterLaunchBanner: () => boolean;
  getDumpsterLaunchBannerCommand: () => HTMLElement['textContent'];
  getStepRows: () => HTMLElement[];
  getRoleBadges: () => (HTMLElement['textContent'] | null)[];
  hasOperationsLedger: () => boolean;
  getOperationsLedgerRows: () => HTMLElement[];
  getActionButtons: () => HTMLElement[];
  getAbandonButtons: () => HTMLElement[];
  clickButtonByLabel: (params: { label: string }) => Promise<void>;
  clickAbandon: () => Promise<void>;
  clickConfirmAbandon: () => Promise<void>;
  clickCancelAbandon: () => Promise<void>;
  hasStreamingBar: () => boolean;
  getExecutionMessages: () => HTMLElement[];
  hasPauseButton: () => boolean;
  hasResumeButton: () => boolean;
  clickPauseButton: () => Promise<void>;
  clickResumeButton: () => Promise<void>;
  hasPostQuestBar: () => boolean;
  hasFollowupButton: () => boolean;
  hasMergeButton: () => boolean;
  clickFollowupButton: () => Promise<void>;
  clickMergeButton: () => Promise<void>;
  hasFollowupChat: () => boolean;
  typeFollowupMessage: (params: { text: string }) => Promise<void>;
  clickFollowupSend: () => Promise<void>;
  clickFollowupStop: () => Promise<void>;
} => {
  AutoScrollContainerWidgetProxy();
  DumpsterCommandBannerWidgetProxy();
  ExecutionRowLayerWidgetProxy();
  ExecutionStatusBarLayerWidgetProxy();
  PixelBtnWidgetProxy();
  QuestSpecPanelWidgetProxy();
  QuestTitleBarWidgetProxy();

  const ledgerProxy = OperationsLedgerWidgetProxy();
  const chatPanelProxy = ChatPanelWidgetProxy();

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

  const clickTestIdButton = async ({ testId }: { testId: string }): Promise<void> => {
    const container = screen.queryByTestId(testId);
    if (!container) {
      return;
    }
    const btn = container.querySelector('[data-testid="PIXEL_BTN"]');
    if (btn) {
      await userEvent.click(btn);
    }
  };

  return {
    clickTab: async ({ tabId }: { tabId: 'followup' | 'execution' | 'spec' }): Promise<void> => {
      const tab = screen.queryByTestId(`execution-panel-tab-${tabId}`);
      if (tab) {
        await userEvent.click(tab);
      }
    },
    hasTabBar: (): boolean => screen.queryByTestId('execution-panel-tab-bar') !== null,
    // Reads the tab bar's own children in DOM order, so the assertion catches a tab added,
    // removed, or reordered — a per-tab getByTestId only ever proves the tabs it names exist.
    getTabLabels: (): (HTMLElement['textContent'] | null)[] => {
      const tabBar = screen.queryByTestId('execution-panel-tab-bar');
      if (!tabBar) {
        return [];
      }
      return Array.from(tabBar.querySelectorAll('[data-testid^="execution-panel-tab-"]')).map(
        (tab) => tab.textContent,
      );
    },
    hasStatusBar: (): boolean => screen.queryByTestId('execution-status-bar-layer-widget') !== null,
    hasFloorContent: (): boolean => screen.queryByTestId('execution-panel-floor-content') !== null,
    hasSpecPanel: (): boolean => screen.queryByTestId('QUEST_SPEC_PANEL') !== null,
    hasActionBar: (): boolean => screen.queryByTestId('execution-panel-action-bar') !== null,
    hasAbandonButton: (): boolean =>
      getAbandonBarButtons().some((btn) => btn.textContent === 'ABANDON QUEST'),
    hasDumpsterLaunchBanner: (): boolean =>
      screen.queryByTestId('DUMPSTER_COMMAND_BANNER') !== null,
    getDumpsterLaunchBannerCommand: (): HTMLElement['textContent'] => {
      const element = screen.queryByTestId('DUMPSTER_COMMAND_BANNER_COMMAND');
      return element?.textContent ?? null;
    },
    getStepRows: (): HTMLElement[] => screen.queryAllByTestId('execution-row-layer-widget'),
    getRoleBadges: (): (HTMLElement['textContent'] | null)[] =>
      screen.queryAllByTestId('execution-row-role-badge').map((el) => el.textContent),
    hasOperationsLedger: (): boolean => ledgerProxy.hasLedger(),
    getOperationsLedgerRows: (): HTMLElement[] => ledgerProxy.getLedgerRows(),
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
    hasStreamingBar: (): boolean => screen.queryByTestId('streaming-bar-layer-widget') !== null,
    getExecutionMessages: (): HTMLElement[] => screen.queryAllByTestId('CHAT_MESSAGE'),
    hasPauseButton: (): boolean => screen.queryByTestId('EXECUTION_PAUSE_BUTTON') !== null,
    hasResumeButton: (): boolean => screen.queryByTestId('EXECUTION_RESUME_BUTTON') !== null,
    clickPauseButton: async (): Promise<void> => {
      await clickTestIdButton({ testId: 'EXECUTION_PAUSE_BUTTON' });
    },
    clickResumeButton: async (): Promise<void> => {
      await clickTestIdButton({ testId: 'EXECUTION_RESUME_BUTTON' });
    },
    hasPostQuestBar: (): boolean => screen.queryByTestId('execution-panel-post-quest-bar') !== null,
    hasFollowupButton: (): boolean => screen.queryByTestId('EXECUTION_FOLLOWUP_BUTTON') !== null,
    hasMergeButton: (): boolean => screen.queryByTestId('EXECUTION_MERGE_BUTTON') !== null,
    clickFollowupButton: async (): Promise<void> => {
      await clickTestIdButton({ testId: 'EXECUTION_FOLLOWUP_BUTTON' });
    },
    clickMergeButton: async (): Promise<void> => {
      await clickTestIdButton({ testId: 'EXECUTION_MERGE_BUTTON' });
    },
    hasFollowupChat: (): boolean => screen.queryByTestId('CHAT_PANEL') !== null,
    typeFollowupMessage: async ({ text }: { text: string }): Promise<void> =>
      chatPanelProxy.typeMessage({ text }),
    clickFollowupSend: async (): Promise<void> => chatPanelProxy.clickSend(),
    clickFollowupStop: async (): Promise<void> => chatPanelProxy.clickStop(),
  };
};
