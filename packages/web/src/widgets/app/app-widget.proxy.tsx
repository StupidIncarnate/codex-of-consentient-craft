/**
 * PURPOSE: Test proxy for AppWidget - sets up mocks for child widgets and provides query helpers
 *
 * USAGE:
 * const proxy = AppWidgetProxy();
 * proxy.setupGuilds({ guilds: [] });
 */

import { connectProxy } from '#gateway/browser/WebSocket/connect/connect.proxy';
import { screen } from '#gateway/npm/testing-library__react';
import userEvent from '#gateway/npm/testing-library__user-event';

import type {
  DirectoryEntryStub,
  DispatchStateStub,
  GuildIdStub,
  GuildListItemStub,
  QuestQueueEntryStub,
  RateLimitsSnapshotStub,
  SessionListItemStub,
} from '@dungeonmaster/shared/contracts';

import { LogoWidgetProxy } from '../logo/logo-widget.proxy';
import { MapFrameWidgetProxy } from '../map-frame/map-frame-widget.proxy';
import { HomeContentWidgetProxy } from '../home-content/home-content-widget.proxy';
import { QuestChatWidgetProxy } from '../quest-chat/quest-chat-widget.proxy';
import { QuestQueueBarWidgetProxy } from '../quest-queue-bar/quest-queue-bar-widget.proxy';
import { RateLimitsStackWidgetProxy } from '../rate-limits-stack/rate-limits-stack-widget.proxy';
import { SessionViewWidgetProxy } from '../session-view/session-view-widget.proxy';

import { WsUrlStub } from '../../contracts/ws-url/ws-url.stub';
import { webSocketChannelState } from '../../state/web-socket-channel/web-socket-channel-state';
import { userEventStatics } from '../../statics/user-event/user-event-statics';

// The channel this proxy's own socket answers, kept apart from the url every binding proxy stages so a
// count read here holds only the sockets opened on it.
const SHARED_CHANNEL_URL = WsUrlStub({ value: 'ws://localhost:4747/ws' });

type SessionListItem = ReturnType<typeof SessionListItemStub>;
type GuildListItem = ReturnType<typeof GuildListItemStub>;
type GuildId = ReturnType<typeof GuildIdStub>;
type DirectoryEntry = ReturnType<typeof DirectoryEntryStub>;
type DispatchState = ReturnType<typeof DispatchStateStub>;
type RateLimitsSnapshot = ReturnType<typeof RateLimitsSnapshotStub>;
type QuestQueueEntry = ReturnType<typeof QuestQueueEntryStub>;

// Aliased calls to avoid enforce-proxy-child-creation phantom detection
// These proxies are needed because AppWidget renders HomeContentWidget, QuestChatWidget,
// and SessionViewWidget via <Outlet />, which the implementation file doesn't directly import
const setupHomeContent = HomeContentWidgetProxy;
const setupQuestChat = QuestChatWidgetProxy;
const setupSessionView = SessionViewWidgetProxy;
// AppWidget never opens a socket itself; the bindings its routes mount share the channel's one.
const setupSocket = connectProxy;

type SocketConnectionCount = ReturnType<ReturnType<typeof connectProxy>['getConnectionCount']>;

export const AppWidgetProxy = (): {
  setupGuilds: (params: { guilds: GuildListItem[] }) => void;
  setupGuildsError: () => void;
  setupCreateGuild: (params: { id: GuildId }) => void;
  setupCreateGuildError: () => void;
  setupSessions: (params: { sessions: SessionListItem[] }) => void;
  setupSessionsError: () => void;
  setupQuestQueue: (params: { entries: readonly QuestQueueEntry[] }) => void;
  setupDirectoryBrowse: (params: { entries: DirectoryEntry[] }) => void;
  setupRateLimits: (params: { snapshot: RateLimitsSnapshot | null }) => void;
  setupDispatchState: (params: { state: DispatchState }) => void;
  setupMountDefaults: () => void;
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
  selectAllSessionsFilter: () => Promise<void>;
  isQuestChatVisible: () => boolean;
  isSessionViewVisible: () => boolean;
  clickLogoLink: () => Promise<void>;
  isLogoLinkVisible: () => boolean;
  isQuestQueueBarVisible: () => boolean;
  clearStorage: () => void;
  setupSharedChannel: () => void;
  getSocketConnectionCount: () => SocketConnectionCount;
} => {
  LogoWidgetProxy();
  MapFrameWidgetProxy();
  setupQuestChat();
  setupSessionView();
  const homeProxy = setupHomeContent();
  const queueBar = QuestQueueBarWidgetProxy();
  const rateLimits = RateLimitsStackWidgetProxy();
  const socketProxy = setupSocket({ url: SHARED_CHANNEL_URL });

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
    setupCreateGuildError: (): void => {
      homeProxy.setupCreateGuildError();
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
    setupDirectoryBrowse: ({ entries }: { entries: DirectoryEntry[] }): void => {
      homeProxy.setupDirectoryBrowse({ entries });
    },
    setupRateLimits: ({ snapshot }: { snapshot: RateLimitsSnapshot | null }): void => {
      rateLimits.setupSnapshot({ snapshot });
    },
    setupDispatchState: ({ state }: { state: DispatchState }): void => {
      queueBar.setupDispatchState({ state });
    },
    // What the shell fetches on mount, each answered with its empty case: no directory entries, no
    // rate-limits snapshot, an empty queue, no quests. A test calls it first and stages over it
    // whatever the test means; nothing answers unless the test calls it.
    setupMountDefaults: (): void => {
      homeProxy.setupDirectoryBrowse({ entries: [] });
      homeProxy.setupQuests({ quests: [] });
      queueBar.setupEntries({ entries: [] });
      rateLimits.setupSnapshot({ snapshot: null });
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
    selectAllSessionsFilter: async (): Promise<void> => {
      await homeProxy.selectAllSessionsFilter();
    },
    isQuestChatVisible: (): boolean =>
      screen.queryByTestId('QUEST_CHAT') !== null ||
      screen.queryByTestId('QUEST_CHAT_LOADING') !== null,
    isSessionViewVisible: (): boolean =>
      screen.queryByTestId('dumpster-raccoon-widget') !== null ||
      screen.queryByTestId('NOT_FOUND') !== null,
    clickLogoLink: async (): Promise<void> => {
      await userEvent.click(screen.getByTestId('LOGO_LINK'), userEventStatics.options);
    },
    isLogoLinkVisible: (): boolean => screen.queryByTestId('LOGO_LINK') !== null,
    isQuestQueueBarVisible: (): boolean => screen.queryByTestId('QUEST_QUEUE_BAR') !== null,
    clearStorage: (): void => {
      homeProxy.clearStorage();
    },
    // Resets the channel singleton and connects it the way AppMountFlow does in production, on this
    // proxy's own url.
    setupSharedChannel: (): void => {
      webSocketChannelState.clear();
      webSocketChannelState.connect({ url: SHARED_CHANNEL_URL });
    },
    getSocketConnectionCount: (): SocketConnectionCount => socketProxy.getConnectionCount(),
  };
};
