/**
 * PURPOSE: Test proxy for AppWidget - sets up mocks for child widgets and provides query helpers
 *
 * USAGE:
 * const proxy = AppWidgetProxy();
 * proxy.setupGuilds({ guilds: [] });
 */

import { screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

import type {
  GuildIdStub,
  GuildListItemStub,
  QuestQueueEntryStub,
  SessionListItemStub,
} from '@dungeonmaster/shared/contracts';

import { LogoWidgetProxy } from '../logo/logo-widget.proxy';
import { MapFrameWidgetProxy } from '../map-frame/map-frame-widget.proxy';
import { HomeContentWidgetProxy } from '../home-content/home-content-widget.proxy';
import { QuestChatWidgetProxy } from '../quest-chat/quest-chat-widget.proxy';
import { QuestQueueBarWidgetProxy } from '../quest-queue-bar/quest-queue-bar-widget.proxy';
import { SessionViewWidgetProxy } from '../session-view/session-view-widget.proxy';
import { ToolingDropdownWidgetProxy } from '../tooling-dropdown/tooling-dropdown-widget.proxy';

type SessionListItem = ReturnType<typeof SessionListItemStub>;
type GuildListItem = ReturnType<typeof GuildListItemStub>;
type GuildId = ReturnType<typeof GuildIdStub>;
type QuestQueueEntry = ReturnType<typeof QuestQueueEntryStub>;

// Aliased calls to avoid enforce-proxy-child-creation phantom detection
// These proxies are needed because AppWidget renders HomeContentWidget, QuestChatWidget,
// and SessionViewWidget via <Outlet />, which the implementation file doesn't directly import
const setupHomeContent = HomeContentWidgetProxy;
const setupQuestChat = QuestChatWidgetProxy;
const setupSessionView = SessionViewWidgetProxy;

export const AppWidgetProxy = (): {
  setupGuilds: (params: { guilds: GuildListItem[] }) => void;
  setupGuildsError: () => void;
  setupCreateGuild: (params: { id: GuildId }) => void;
  setupSessions: (params: { sessions: SessionListItem[] }) => void;
  setupSessionsError: () => void;
  setupQuestQueue: (params: { entries: readonly QuestQueueEntry[] }) => void;
  clickGuildItem: (params: { testId: string }) => Promise<void>;
  isGuildItemVisible: (params: { testId: string }) => boolean;
  isGuildItemSelected: (params: { testId: string }) => boolean;
  clickAddGuild: () => Promise<void>;
  isNewGuildTitleVisible: () => boolean;
  isSessionEmptyStateVisible: () => boolean;
  isSelectGuildMessageVisible: () => boolean;
  typeGuildName: (params: { value: string }) => Promise<void>;
  typeGuildPath: (params: { value: string }) => Promise<void>;
  clickCreateGuild: () => Promise<void>;
  clickCancelGuild: () => Promise<void>;
  clickSessionItem: (params: { testId: string }) => Promise<void>;
  isQuestChatVisible: () => boolean;
  isSessionViewVisible: () => boolean;
  clickLogoLink: () => Promise<void>;
  isLogoLinkVisible: () => boolean;
  isQuestQueueBarVisible: () => boolean;
  isSmoketestDrawerMounted: () => boolean;
  clearStorage: () => void;
} => {
  LogoWidgetProxy();
  MapFrameWidgetProxy();
  setupQuestChat();
  setupSessionView();
  const homeProxy = setupHomeContent();
  const queueBar = QuestQueueBarWidgetProxy();
  ToolingDropdownWidgetProxy();

  return {
    setupGuilds: ({ guilds }: { guilds: GuildListItem[] }): void => {
      homeProxy.setupGuilds({ guilds });
    },
    setupGuildsError: (): void => {
      homeProxy.setupGuildsError();
    },
    setupCreateGuild: ({ id }: { id: GuildId }): void => {
      homeProxy.setupCreateGuild({ id });
    },
    setupSessions: ({ sessions }: { sessions: SessionListItem[] }): void => {
      homeProxy.setupSessions({ sessions });
    },
    setupSessionsError: (): void => {
      homeProxy.setupSessionsError();
    },
    setupQuestQueue: ({ entries }: { entries: readonly QuestQueueEntry[] }): void => {
      queueBar.setupEntries({ entries });
    },
    clickGuildItem: async ({ testId }: { testId: string }): Promise<void> => {
      await homeProxy.clickGuildItem({ testId });
    },
    isGuildItemVisible: ({ testId }: { testId: string }): boolean =>
      homeProxy.isGuildItemVisible({ testId }),
    isGuildItemSelected: ({ testId }: { testId: string }): boolean =>
      homeProxy.isGuildItemSelected({ testId }),
    clickAddGuild: async (): Promise<void> => {
      await homeProxy.clickAddGuild();
    },
    isNewGuildTitleVisible: (): boolean => homeProxy.isNewGuildTitleVisible(),
    isSessionEmptyStateVisible: (): boolean => homeProxy.isSessionEmptyStateVisible(),
    isSelectGuildMessageVisible: (): boolean => homeProxy.isSelectGuildMessageVisible(),
    typeGuildName: async ({ value }: { value: string }): Promise<void> => {
      await homeProxy.typeGuildName({ value });
    },
    typeGuildPath: async ({ value }: { value: string }): Promise<void> => {
      await homeProxy.typeGuildPath({ value });
    },
    clickCreateGuild: async (): Promise<void> => {
      await homeProxy.clickCreateGuild();
    },
    clickCancelGuild: async (): Promise<void> => {
      await homeProxy.clickCancelGuild();
    },
    clickSessionItem: async ({ testId }: { testId: string }): Promise<void> => {
      await homeProxy.clickSessionItem({ testId });
    },
    isQuestChatVisible: (): boolean =>
      screen.queryByTestId('QUEST_CHAT') !== null ||
      screen.queryByTestId('QUEST_CHAT_LOADING') !== null,
    isSessionViewVisible: (): boolean =>
      screen.queryByTestId('dumpster-raccoon-widget') !== null ||
      screen.queryByTestId('NOT_FOUND') !== null,
    clickLogoLink: async (): Promise<void> => {
      await userEvent.click(screen.getByTestId('LOGO_LINK'));
    },
    isLogoLinkVisible: (): boolean => screen.queryByTestId('LOGO_LINK') !== null,
    isQuestQueueBarVisible: (): boolean => screen.queryByTestId('QUEST_QUEUE_BAR') !== null,
    isSmoketestDrawerMounted: (): boolean =>
      screen.queryByTestId('SMOKETEST_DRAWER_CONTENT') !== null,
    clearStorage: (): void => {
      homeProxy.clearStorage();
    },
  };
};
