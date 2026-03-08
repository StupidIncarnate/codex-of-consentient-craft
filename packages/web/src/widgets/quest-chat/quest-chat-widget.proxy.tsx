/**
 * PURPOSE: Test proxy for QuestChatWidget - sets up mocks for all bindings and adapters used by the widget
 *
 * USAGE:
 * const proxy = QuestChatWidgetProxy();
 * proxy.setupGuilds({ guilds });
 */

import { screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

import type {
  GuildListItemStub,
  GuildStub,
  ProcessId,
  QuestStub,
  SessionListItemStub,
} from '@dungeonmaster/shared/contracts';

import type { AskUserQuestionOption } from '../../contracts/ask-user-question/ask-user-question-contract';
import { useGuildDetailBindingProxy } from '../../bindings/use-guild-detail/use-guild-detail-binding.proxy';
import { useGuildsBindingProxy } from '../../bindings/use-guilds/use-guilds-binding.proxy';
import { useQuestEventsBindingProxy } from '../../bindings/use-quest-events/use-quest-events-binding.proxy';
import { useSessionChatBindingProxy } from '../../bindings/use-session-chat/use-session-chat-binding.proxy';
import { useSessionListBindingProxy } from '../../bindings/use-session-list/use-session-list-binding.proxy';
import { designSessionBrokerProxy } from '../../brokers/design/session/design-session-broker.proxy';
import { designStartBrokerProxy } from '../../brokers/design/start/design-start-broker.proxy';
import { questModifyBrokerProxy } from '../../brokers/quest/modify/quest-modify-broker.proxy';
import { ChatPanelWidgetProxy } from '../chat-panel/chat-panel-widget.proxy';
import { DesignPanelWidgetProxy } from '../design-panel/design-panel-widget.proxy';
import { DumpsterRaccoonWidgetProxy } from '../dumpster-raccoon/dumpster-raccoon-widget.proxy';
import { ExecutionPanelWidgetProxy } from '../execution-panel/execution-panel-widget.proxy';
import { QuestClarifyPanelWidgetProxy } from '../quest-clarify-panel/quest-clarify-panel-widget.proxy';
import { QuestSpecPanelWidgetProxy } from '../quest-spec-panel/quest-spec-panel-widget.proxy';

type GuildListItem = ReturnType<typeof GuildListItemStub>;
type Quest = ReturnType<typeof QuestStub>;
type Guild = ReturnType<typeof GuildStub>;
type SessionListItem = ReturnType<typeof SessionListItemStub>;

export const QuestChatWidgetProxy = (): {
  setupChat: (params: { chatProcessId: ProcessId }) => void;
  setupChatError: () => void;
  setupStop: () => void;
  receiveWsMessage: (params: { data: string }) => void;
  setupGuilds: (params: { guilds: GuildListItem[] }) => void;
  setupSessions: (params: { sessions: SessionListItem[] }) => void;
  setupQuest: (params: { quest: Quest }) => void;
  setupGuild: (params: { guild: Guild }) => void;
  setupGuildError: () => void;
  getSentWsMessages: () => unknown[];
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
} => {
  const guildsBindingProxy = useGuildsBindingProxy();
  const sessionListProxy = useSessionListBindingProxy();
  const guildDetailProxy = useGuildDetailBindingProxy();
  useQuestEventsBindingProxy();
  const chatBindingProxy = useSessionChatBindingProxy();
  ChatPanelWidgetProxy();
  QuestClarifyPanelWidgetProxy();
  const specPanelProxy = QuestSpecPanelWidgetProxy();
  const modifyProxy = questModifyBrokerProxy();
  const designStartProxy = designStartBrokerProxy();
  const designSessionProxy = designSessionBrokerProxy();
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
    setupSessions: ({ sessions }: { sessions: SessionListItem[] }): void => {
      sessionListProxy.setupSessions({ sessions });
    },
    setupQuest: ({ quest }: { quest: Quest }): void => {
      chatBindingProxy.receiveWsMessage({
        data: JSON.stringify({
          type: 'quest-modified',
          payload: { questId: quest.id, quest },
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
  };
};
