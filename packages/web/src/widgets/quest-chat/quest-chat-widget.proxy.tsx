/**
 * PURPOSE: Test proxy for QuestChatWidget - sets up mocks for all bindings and adapters used by the widget
 *
 * USAGE:
 * const proxy = QuestChatWidgetProxy();
 * proxy.setupGuilds({ guilds });
 */

import { screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

import type { SpyOnHandle } from '@dungeonmaster/testing/register-mock';
import { registerSpyOn } from '@dungeonmaster/testing/register-mock';

import type {
  GuildListItemStub,
  GuildStub,
  ProcessId,
  QuestStub,
} from '@dungeonmaster/shared/contracts';
import { WorkItemStub } from '@dungeonmaster/shared/contracts';
import type { RequestCount } from '@dungeonmaster/testing';

import type { AskUserQuestionOption } from '../../contracts/ask-user-question/ask-user-question-contract';
import { websocketConnectAdapterProxy } from '../../adapters/websocket/connect/websocket-connect-adapter.proxy';
import { useAgentOutputBindingProxy } from '../../bindings/use-agent-output/use-agent-output-binding.proxy';
import { useGuildDetailBindingProxy } from '../../bindings/use-guild-detail/use-guild-detail-binding.proxy';
import { useGuildsBindingProxy } from '../../bindings/use-guilds/use-guilds-binding.proxy';
import { useQuestEventsBindingProxy } from '../../bindings/use-quest-events/use-quest-events-binding.proxy';
import { useSessionChatBindingProxy } from '../../bindings/use-session-chat/use-session-chat-binding.proxy';
import { designSessionBrokerProxy } from '../../brokers/design/session/design-session-broker.proxy';
import { designStartBrokerProxy } from '../../brokers/design/start/design-start-broker.proxy';
import { questModifyBrokerProxy } from '../../brokers/quest/modify/quest-modify-broker.proxy';
import { questPauseBrokerProxy } from '../../brokers/quest/pause/quest-pause-broker.proxy';
import { questStartBrokerProxy } from '../../brokers/quest/start/quest-start-broker.proxy';
import { ChatPanelWidgetProxy } from '../chat-panel/chat-panel-widget.proxy';
import { DesignPanelWidgetProxy } from '../design-panel/design-panel-widget.proxy';
import { DumpsterRaccoonWidgetProxy } from '../dumpster-raccoon/dumpster-raccoon-widget.proxy';
import { ExecutionPanelWidgetProxy } from '../execution-panel/execution-panel-widget.proxy';
import { QuestApprovedModalWidgetProxy } from '../quest-approved-modal/quest-approved-modal-widget.proxy';
import { QuestSpecPanelWidgetProxy } from '../quest-spec-panel/quest-spec-panel-widget.proxy';

type GuildListItem = ReturnType<typeof GuildListItemStub>;
type Quest = ReturnType<typeof QuestStub>;
type Guild = ReturnType<typeof GuildStub>;

export const QuestChatWidgetProxy = ({ deferOpen = false }: { deferOpen?: boolean } = {}): {
  setupChat: (params: { chatProcessId: ProcessId }) => void;
  setupChatError: () => void;
  setupStop: () => void;
  receiveWsMessage: (params: { data: string }) => void;
  setupGuilds: (params: { guilds: GuildListItem[] }) => void;
  setupQuest: (params: { quest: Quest }) => void;
  setupGuild: (params: { guild: Guild }) => void;
  setupGuildError: () => void;
  getSentWsMessages: () => unknown[];
  triggerWsOpen: () => void;
  hasChatPanel: () => boolean;
  hasActivityPlaceholder: () => boolean;
  hasDivider: () => boolean;
  getActivityText: () => HTMLElement['textContent'];
  hasClarifyPanel: () => boolean;
  hasSpecPanel: () => boolean;
  getClarifyQuestionText: () => HTMLElement['textContent'];
  getClarifyOptionLabels: () => HTMLElement['textContent'][];
  clickClarifyOption: (params: { label: AskUserQuestionOption['label'] }) => Promise<void>;
  clickApprove: () => Promise<void>;
  setupModify: () => void;
  hasDesignTabBar: () => boolean;
  hasDesignStartButton: () => boolean;
  hasDesignPanel: () => boolean;
  clickDesignTab: () => Promise<void>;
  clickSpecTab: () => Promise<void>;
  clickStartDesign: () => Promise<void>;
  setupDesignStart: (params: { port: Quest['designPort'] }) => void;
  setupDesignSession: (params: { chatProcessId: ProcessId }) => void;
  hasExecutionPanel: () => boolean;
  hasDumpsterRaccoon: () => boolean;
  hasApprovedModal: () => boolean;
  clickApprovedModalBeginQuest: () => Promise<void>;
  clickApprovedModalKeepChatting: () => Promise<void>;
  clickApprovedModalNewQuest: () => Promise<void>;
  setupQuestStart: (params: { processId: string }) => void;
  getQuestStartRequestCount: () => RequestCount;
  setupConsoleErrorCapture: () => SpyOnHandle;
  setupQuestStartError: () => void;
  setupQuestModifyError: () => void;
  setupQuestPauseError: () => void;
} => {
  websocketConnectAdapterProxy({ deferOpen });
  useAgentOutputBindingProxy();
  const guildsBindingProxy = useGuildsBindingProxy();
  const guildDetailProxy = useGuildDetailBindingProxy();
  useQuestEventsBindingProxy();
  const chatBindingProxy = useSessionChatBindingProxy({ deferOpen });
  ChatPanelWidgetProxy();
  const specPanelProxy = QuestSpecPanelWidgetProxy();
  const modifyProxy = questModifyBrokerProxy();
  const pauseProxy = questPauseBrokerProxy();
  const startProxy = questStartBrokerProxy();
  const designStartProxy = designStartBrokerProxy();
  const designSessionProxy = designSessionBrokerProxy();
  const approvedModalProxy = QuestApprovedModalWidgetProxy();
  DesignPanelWidgetProxy();
  DumpsterRaccoonWidgetProxy();
  ExecutionPanelWidgetProxy();

  return {
    setupChat: ({ chatProcessId }: { chatProcessId: ProcessId }): void => {
      chatBindingProxy.setupChat({ chatProcessId });
    },
    setupChatError: (): void => {
      chatBindingProxy.setupChatError();
    },
    setupStop: (): void => {
      chatBindingProxy.setupStop();
    },
    receiveWsMessage: ({ data }: { data: string }): void => {
      chatBindingProxy.receiveWsMessage({ data });
    },
    setupGuilds: ({ guilds }: { guilds: GuildListItem[] }): void => {
      guildsBindingProxy.setupGuilds({ guilds });
    },
    setupQuest: ({ quest }: { quest: Quest }): void => {
      const questWithWorkItem =
        quest.workItems.length === 0
          ? { ...quest, workItems: [WorkItemStub({ sessionId: quest.id as never })] }
          : quest;

      chatBindingProxy.receiveWsMessage({
        data: JSON.stringify({
          type: 'quest-modified',
          payload: { questId: quest.id, quest: questWithWorkItem },
          timestamp: '2025-01-01T00:00:00.000Z',
        }),
      });
    },
    setupGuild: ({ guild }: { guild: Guild }): void => {
      guildDetailProxy.setupGuild({ guild });
    },
    setupGuildError: (): void => {
      guildDetailProxy.setupError();
    },
    getSentWsMessages: (): unknown[] => chatBindingProxy.getSentWsMessages(),
    triggerWsOpen: (): void => {
      chatBindingProxy.triggerWsOpen();
    },
    hasChatPanel: (): boolean => screen.queryByTestId('CHAT_PANEL') !== null,
    hasActivityPlaceholder: (): boolean => screen.queryByTestId('QUEST_CHAT_ACTIVITY') !== null,
    hasDivider: (): boolean => screen.queryByTestId('QUEST_CHAT_DIVIDER') !== null,
    getActivityText: (): HTMLElement['textContent'] => {
      const element = screen.queryByTestId('QUEST_CHAT_ACTIVITY');
      return element?.textContent ?? null;
    },
    hasClarifyPanel: (): boolean => screen.queryByTestId('QUEST_CLARIFY_PANEL') !== null,
    hasSpecPanel: (): boolean => screen.queryByTestId('QUEST_SPEC_PANEL') !== null,
    getClarifyQuestionText: (): HTMLElement['textContent'] => {
      const element = screen.queryByTestId('CLARIFY_QUESTION_TEXT');
      return element?.textContent ?? null;
    },
    getClarifyOptionLabels: (): HTMLElement['textContent'][] => {
      const options = screen.queryAllByTestId('CLARIFY_OPTION');
      return options.map((el) => el.textContent);
    },
    clickClarifyOption: async ({
      label,
    }: {
      label: AskUserQuestionOption['label'];
    }): Promise<void> => {
      const options = screen.getAllByTestId('CLARIFY_OPTION');
      const target = options.find((el) => el.textContent?.includes(label));
      if (target) {
        await userEvent.click(target);
      }
    },
    clickApprove: async (): Promise<void> => {
      await specPanelProxy.clickApprove();
    },
    setupModify: (): void => {
      modifyProxy.setupModify();
    },
    hasDesignTabBar: (): boolean => screen.queryByTestId('DESIGN_TAB_BAR') !== null,
    hasDesignStartButton: (): boolean => screen.queryByTestId('DESIGN_START_BUTTON') !== null,
    hasDesignPanel: (): boolean =>
      screen.queryByTestId('DESIGN_IFRAME') !== null ||
      screen.queryByTestId('DESIGN_PANEL_PLACEHOLDER') !== null,
    clickDesignTab: async (): Promise<void> => {
      const tab = screen.queryByTestId('TAB_DESIGN');
      if (tab) {
        await userEvent.click(tab);
      }
    },
    clickSpecTab: async (): Promise<void> => {
      const tab = screen.queryByTestId('TAB_SPEC');
      if (tab) {
        await userEvent.click(tab);
      }
    },
    clickStartDesign: async (): Promise<void> => {
      const button = screen.queryByTestId('DESIGN_START_BUTTON');
      if (button) {
        await userEvent.click(button);
      }
    },
    setupDesignStart: ({ port }: { port: Quest['designPort'] }): void => {
      designStartProxy.setupStart({ port });
    },
    setupDesignSession: ({ chatProcessId }: { chatProcessId: ProcessId }): void => {
      designSessionProxy.setupSession({ chatProcessId });
    },
    hasExecutionPanel: (): boolean => screen.queryByTestId('execution-panel-widget') !== null,
    hasDumpsterRaccoon: (): boolean => screen.queryByTestId('dumpster-raccoon-widget') !== null,
    hasApprovedModal: (): boolean => approvedModalProxy.hasModal(),
    clickApprovedModalBeginQuest: async (): Promise<void> => {
      await approvedModalProxy.clickBeginQuest();
    },
    clickApprovedModalKeepChatting: async (): Promise<void> => {
      await approvedModalProxy.clickKeepChatting();
    },
    clickApprovedModalNewQuest: async (): Promise<void> => {
      await approvedModalProxy.clickNewQuest();
    },
    setupQuestStart: ({ processId }: { processId: string }): void => {
      startProxy.setupStart({ processId });
    },
    getQuestStartRequestCount: (): RequestCount => startProxy.getRequestCount(),
    setupConsoleErrorCapture: (): SpyOnHandle => {
      const handle = registerSpyOn({ object: globalThis.console, method: 'error' });
      handle.mockImplementation(() => undefined);
      return handle;
    },
    setupQuestStartError: (): void => {
      startProxy.setupError();
    },
    setupQuestModifyError: (): void => {
      modifyProxy.setupError();
    },
    setupQuestPauseError: (): void => {
      pauseProxy.setupError();
    },
  };
};
