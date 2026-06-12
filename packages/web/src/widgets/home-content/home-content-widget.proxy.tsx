/**
 * PURPOSE: Test proxy for HomeContentWidget - sets up mocks for guilds, sessions, and guild creation
 *
 * USAGE:
 * const proxy = HomeContentWidgetProxy();
 * proxy.setupGuilds({ guilds: [] });
 */

import { screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

import type { SpyOnHandle } from '@dungeonmaster/testing/register-mock';
import { registerSpyOn } from '@dungeonmaster/testing/register-mock';

import type {
  GuildIdStub,
  GuildListItemStub,
  QuestListItemStub,
  SessionListItemStub,
} from '@dungeonmaster/shared/contracts';

import * as questDeleteBrokerModule from '../../brokers/quest/delete/quest-delete-broker';

import { mantineNotificationsShowAdapterProxy } from '../../adapters/mantine/notifications-show/mantine-notifications-show-adapter.proxy';
import { useGuildsBindingProxy } from '../../bindings/use-guilds/use-guilds-binding.proxy';
import { useQuestsBindingProxy } from '../../bindings/use-quests/use-quests-binding.proxy';
import { useSessionListBindingProxy } from '../../bindings/use-session-list/use-session-list-binding.proxy';
import { guildCreateBrokerProxy } from '../../brokers/guild/create/guild-create-broker.proxy';
import { questDeleteBrokerProxy } from '../../brokers/quest/delete/quest-delete-broker.proxy';
import { GuildAddModalWidgetProxy } from '../guild-add-modal/guild-add-modal-widget.proxy';
import { GuildEmptyStateWidgetProxy } from '../guild-empty-state/guild-empty-state-widget.proxy';
import { GuildListWidgetProxy } from '../guild-list/guild-list-widget.proxy';
import { GuildSessionListWidgetProxy } from '../guild-session-list/guild-session-list-widget.proxy';

type SessionListItem = ReturnType<typeof SessionListItemStub>;
type GuildListItem = ReturnType<typeof GuildListItemStub>;
type GuildId = ReturnType<typeof GuildIdStub>;
type QuestListItem = ReturnType<typeof QuestListItemStub>;

export const HomeContentWidgetProxy = (): {
  setupGuilds: (params: { guilds: GuildListItem[] }) => void;
  setupGuildsError: () => void;
  setupCreateGuild: (params: { id: GuildId }) => void;
  setupSessions: (params: { sessions: SessionListItem[] }) => void;
  setupSessionsError: () => void;
  setupQuests: (params: { quests: QuestListItem[] }) => void;
  setupQuestsError: () => void;
  clickGuildItem: (params: { testId: string }) => Promise<void>;
  isGuildItemVisible: (params: { testId: string }) => boolean;
  isGuildItemSelected: (params: { testId: string }) => boolean;
  clickAddGuild: () => Promise<void>;
  clickAddSession: () => Promise<void>;
  isNewGuildTitleVisible: () => boolean;
  isSessionEmptyStateVisible: () => boolean;
  isSelectGuildMessageVisible: () => boolean;
  typeGuildName: (params: { value: string }) => Promise<void>;
  typeGuildPath: (params: { value: string }) => Promise<void>;
  clickCreateGuild: () => Promise<void>;
  clickCancelGuild: () => Promise<void>;
  clickSessionItem: (params: { testId: string }) => Promise<void>;
  selectAllSessionsFilter: () => Promise<void>;
  setupConsoleErrorCapture: () => SpyOnHandle;
  setupCreateGuildError: () => void;
  clearStorage: () => void;
  setupDeleteQuest: () => void;
  setupDeleteQuestRejectsWithMessage: (params: { message: string }) => void;
  setupDeleteQuestRejectsWithoutMessage: () => void;
  clickDeleteButton: (params: { testId: string }) => Promise<void>;
  clickBanish: () => Promise<void>;
  isPopoverVisible: (params: { testId: string }) => boolean;
  getShownToast: () => unknown;
  getDeleteBrokerCalls: () => SpyOnHandle['mock']['calls'];
} => {
  const sessionsProxy = useSessionListBindingProxy();
  const guildsProxy = useGuildsBindingProxy();
  const questsProxy = useQuestsBindingProxy();
  const createGuildProxy = guildCreateBrokerProxy();
  const deleteQuestProxy = questDeleteBrokerProxy();
  const deleteBrokerSpy = registerSpyOn({
    object: questDeleteBrokerModule,
    method: 'questDeleteBroker',
    passthrough: true,
  });
  const notificationsProxy = mantineNotificationsShowAdapterProxy();
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
    setupQuests: ({ quests }: { quests: QuestListItem[] }): void => {
      questsProxy.setupQuests({ quests });
    },
    setupQuestsError: (): void => {
      questsProxy.setupError();
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
    clickAddSession: async (): Promise<void> => {
      const sessionListEl = screen.getByTestId('GUILD_SESSION_LIST');
      const addButton = within(sessionListEl).getByTestId('PIXEL_BTN');
      await userEvent.click(addButton);
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
    selectAllSessionsFilter: async (): Promise<void> => {
      await sessionList.clickFilterOption({ label: 'All' });
    },
    setupConsoleErrorCapture: (): SpyOnHandle => {
      const handle = registerSpyOn({ object: globalThis.console, method: 'error' });
      handle.mockImplementation(() => undefined);
      return handle;
    },
    setupCreateGuildError: (): void => {
      createGuildProxy.setupError();
    },
    setupDeleteQuest: (): void => {
      deleteQuestProxy.setupDelete();
    },
    setupDeleteQuestRejectsWithMessage: ({ message }: { message: string }): void => {
      deleteBrokerSpy.mockImplementation(async () => {
        await Promise.resolve();
        throw new Error(message);
      });
    },
    setupDeleteQuestRejectsWithoutMessage: (): void => {
      deleteBrokerSpy.mockImplementation(async () => {
        await Promise.resolve();
        throw new Error('');
      });
    },
    clickDeleteButton: async ({ testId }: { testId: string }): Promise<void> => {
      await sessionList.clickDeleteButton({ testId });
    },
    clickBanish: async (): Promise<void> => {
      await sessionList.clickBanish();
    },
    isPopoverVisible: ({ testId }: { testId: string }): boolean =>
      sessionList.isPopoverVisible({ testId }),
    getShownToast: (): unknown => notificationsProxy.getShownNotification(),
    getDeleteBrokerCalls: (): SpyOnHandle['mock']['calls'] => deleteBrokerSpy.mock.calls,
    clearStorage: (): void => {
      localStorage.clear();
    },
  };
};
