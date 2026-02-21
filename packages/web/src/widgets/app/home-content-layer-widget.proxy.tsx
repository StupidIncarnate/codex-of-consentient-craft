/**
 * PURPOSE: Test proxy for HomeContentLayerWidget - sets up mocks for guilds, sessions, and guild creation
 *
 * USAGE:
 * const proxy = HomeContentLayerWidgetProxy();
 * proxy.setupGuilds({ guilds: [] });
 */

import { screen } from '@testing-library/react';

import type {
  GuildIdStub,
  GuildListItemStub,
  SessionListItemStub,
} from '@dungeonmaster/shared/contracts';

import { useGuildsBindingProxy } from '../../bindings/use-guilds/use-guilds-binding.proxy';
import { useSessionListBindingProxy } from '../../bindings/use-session-list/use-session-list-binding.proxy';
import { guildCreateBrokerProxy } from '../../brokers/guild/create/guild-create-broker.proxy';
import { GuildAddModalWidgetProxy } from '../guild-add-modal/guild-add-modal-widget.proxy';
import { GuildEmptyStateWidgetProxy } from '../guild-empty-state/guild-empty-state-widget.proxy';
import { GuildListWidgetProxy } from '../guild-list/guild-list-widget.proxy';
import { GuildSessionListWidgetProxy } from '../guild-session-list/guild-session-list-widget.proxy';

type SessionListItem = ReturnType<typeof SessionListItemStub>;
type GuildListItem = ReturnType<typeof GuildListItemStub>;
type GuildId = ReturnType<typeof GuildIdStub>;

export const HomeContentLayerWidgetProxy = (): {
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
} => {
  const sessionsProxy = useSessionListBindingProxy();
  const guildsProxy = useGuildsBindingProxy();
  const createGuildProxy = guildCreateBrokerProxy();
  const guildList = GuildListWidgetProxy();
  const sessionList = GuildSessionListWidgetProxy();
  const emptyState = GuildEmptyStateWidgetProxy();
  GuildAddModalWidgetProxy();

  return {
    setupGuilds: ({ guilds }: { guilds: GuildListItem[] }): void => {
      guildsProxy.setupGuilds({ guilds });
    },
    setupGuildsError: (): void => {
      guildsProxy.setupError();
    },
    setupCreateGuild: ({ id }: { id: GuildId }): void => {
      createGuildProxy.setupCreate({ id });
    },
    setupSessions: ({ sessions }: { sessions: SessionListItem[] }): void => {
      sessionsProxy.setupSessions({ sessions });
    },
    setupSessionsError: (): void => {
      sessionsProxy.setupError();
    },
    clickGuildItem: async ({ testId }: { testId: string }): Promise<void> => {
      await guildList.clickItem({ testId });
    },
    isGuildItemVisible: ({ testId }: { testId: string }): boolean =>
      guildList.isItemVisible({ testId }),
    isGuildItemSelected: ({ testId }: { testId: string }): boolean =>
      guildList.isItemSelected({ testId }),
    clickAddGuild: async (): Promise<void> => {
      await guildList.clickAddButton();
    },
    isNewGuildTitleVisible: (): boolean => emptyState.isNewGuildTitleVisible(),
    isSessionEmptyStateVisible: (): boolean => sessionList.hasEmptyState(),
    isSelectGuildMessageVisible: (): boolean => screen.queryByText('Select a guild') !== null,
    typeGuildName: async ({ value }: { value: string }): Promise<void> => {
      await emptyState.typeGuildName({ value });
    },
    typeGuildPath: async ({ value }: { value: string }): Promise<void> => {
      await emptyState.typeGuildPath({ value });
    },
    clickCreateGuild: async (): Promise<void> => {
      await emptyState.clickCreate();
    },
    clickCancelGuild: async (): Promise<void> => {
      await emptyState.clickCancel();
    },
    clickSessionItem: async ({ testId }: { testId: string }): Promise<void> => {
      await sessionList.clickSession({ testId });
    },
  };
};
