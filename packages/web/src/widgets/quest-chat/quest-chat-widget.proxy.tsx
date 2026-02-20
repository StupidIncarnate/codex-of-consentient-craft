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
} from '@dungeonmaster/shared/contracts';

import type { AskUserQuestionOption } from '../../contracts/ask-user-question/ask-user-question-contract';
import { useGuildDetailBindingProxy } from '../../bindings/use-guild-detail/use-guild-detail-binding.proxy';
import { useGuildsBindingProxy } from '../../bindings/use-guilds/use-guilds-binding.proxy';
import { useQuestChatBindingProxy } from '../../bindings/use-quest-chat/use-quest-chat-binding.proxy';
import { useQuestDetailBindingProxy } from '../../bindings/use-quest-detail/use-quest-detail-binding.proxy';
import { websocketConnectAdapterProxy } from '../../adapters/websocket/connect/websocket-connect-adapter.proxy';
import { ChatPanelWidgetProxy } from '../chat-panel/chat-panel-widget.proxy';
import { QuestClarifyPanelWidgetProxy } from '../quest-clarify-panel/quest-clarify-panel-widget.proxy';

type GuildListItem = ReturnType<typeof GuildListItemStub>;
type Quest = ReturnType<typeof QuestStub>;
type Guild = ReturnType<typeof GuildStub>;

export const QuestChatWidgetProxy = (): {
  setupChat: (params: { chatProcessId: ProcessId }) => void;
  setupChatError: () => void;
  setupStop: () => void;
  receiveWsMessage: (params: { data: string }) => void;
  setupGuilds: (params: { guilds: GuildListItem[] }) => void;
  setupQuest: (params: { quest: Quest }) => void;
  setupQuestError: () => void;
  setupGuild: (params: { guild: Guild }) => void;
  setupGuildError: () => void;
  setupQuestHistory: (params: { entries: unknown[] }) => void;
  setupGuildHistory: (params: { entries: unknown[] }) => void;
  hasChatPanel: () => boolean;
  hasActivityPlaceholder: () => boolean;
  hasDivider: () => boolean;
  getActivityText: () => HTMLElement['textContent'];
  hasClarifyPanel: () => boolean;
  getClarifyQuestionText: () => HTMLElement['textContent'];
  getClarifyOptionLabels: () => HTMLElement['textContent'][];
  clickClarifyOption: (params: { label: AskUserQuestionOption['label'] }) => Promise<void>;
} => {
  const guildsBindingProxy = useGuildsBindingProxy();
  const questDetailProxy = useQuestDetailBindingProxy();
  const guildDetailProxy = useGuildDetailBindingProxy();
  const chatBindingProxy = useQuestChatBindingProxy();
  ChatPanelWidgetProxy();
  QuestClarifyPanelWidgetProxy();
  websocketConnectAdapterProxy();

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
      questDetailProxy.setupQuest({ quest });
    },
    setupQuestError: (): void => {
      questDetailProxy.setupError();
    },
    setupGuild: ({ guild }: { guild: Guild }): void => {
      guildDetailProxy.setupGuild({ guild });
    },
    setupGuildError: (): void => {
      guildDetailProxy.setupError();
    },
    setupQuestHistory: ({ entries }: { entries: unknown[] }): void => {
      chatBindingProxy.setupQuestHistory({ entries });
    },
    setupGuildHistory: ({ entries }: { entries: unknown[] }): void => {
      chatBindingProxy.setupGuildHistory({ entries });
    },
    hasChatPanel: (): boolean => screen.queryByTestId('CHAT_PANEL') !== null,
    hasActivityPlaceholder: (): boolean => screen.queryByTestId('QUEST_CHAT_ACTIVITY') !== null,
    hasDivider: (): boolean => screen.queryByTestId('QUEST_CHAT_DIVIDER') !== null,
    getActivityText: (): HTMLElement['textContent'] => {
      const element = screen.queryByTestId('QUEST_CHAT_ACTIVITY');
      return element?.textContent ?? null;
    },
    hasClarifyPanel: (): boolean => screen.queryByTestId('QUEST_CLARIFY_PANEL') !== null,
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
  };
};
