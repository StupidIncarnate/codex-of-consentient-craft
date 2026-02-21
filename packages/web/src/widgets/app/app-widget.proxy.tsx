/**
 * PURPOSE: Test proxy for AppWidget - sets up mocks for child widgets and provides query helpers
 *
 * USAGE:
 * const proxy = AppWidgetProxy();
 * proxy.setupGuilds({ guilds: [] });
 */

import { screen } from '@testing-library/react';

import type {
  GuildIdStub,
  GuildListItemStub,
  SessionListItemStub,
} from '@dungeonmaster/shared/contracts';

import { LogoWidgetProxy } from '../logo/logo-widget.proxy';
import { MapFrameWidgetProxy } from '../map-frame/map-frame-widget.proxy';
import { QuestChatWidgetProxy } from '../quest-chat/quest-chat-widget.proxy';
import { HomeContentLayerWidgetProxy } from './home-content-layer-widget.proxy';

type SessionListItem = ReturnType<typeof SessionListItemStub>;
type GuildListItem = ReturnType<typeof GuildListItemStub>;
type GuildId = ReturnType<typeof GuildIdStub>;

export const AppWidgetProxy = (): {
  setupGuilds: (params: { guilds: GuildListItem[] }) => void;
  setupGuildsError: () => void;
  setupCreateGuild: (params: { id: GuildId }) => void;
  setupSessions: (params: { sessions: SessionListItem[] }) => void;
  setupSessionsError: () => void;
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
} => {
  LogoWidgetProxy();
  MapFrameWidgetProxy();
  QuestChatWidgetProxy();
  const homeProxy = HomeContentLayerWidgetProxy();

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
    isQuestChatVisible: (): boolean => screen.queryByTestId('QUEST_CHAT') !== null,
  };
};
