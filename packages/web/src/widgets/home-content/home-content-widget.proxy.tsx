/**
 * PURPOSE: Test proxy for HomeContentWidget - sets up mocks for guilds, sessions, and guild creation
 *
 * USAGE:
 * const proxy = HomeContentWidgetProxy();
 * proxy.setupGuilds({ guilds: [] });
 */

import { notifications } from '#gateway/npm/mantine__notifications';
import { screen, within } from '#gateway/npm/testing-library__react';
import userEvent from '#gateway/npm/testing-library__user-event';
import { consoleErrorProxy } from '#gateway/browser/console/console-error/console-error.proxy';
import { clear } from '#gateway/browser/localStorage';
import { readItemProxy } from '#gateway/browser/localStorage/read-item/read-item.proxy';
import { StorageDisabledErrorStub } from '#gateway/browser/localStorage/read-item/storage-disabled-error.stub';
import { removeItemProxy } from '#gateway/browser/localStorage/remove-item/remove-item.proxy';
import { writeItemProxy } from '#gateway/browser/localStorage/write-item/write-item.proxy';

import type { RecordedCalls } from '@dungeonmaster/testing/register-mock';
import { registerMock, registerSpyOn } from '@dungeonmaster/testing/register-mock';
import type { MockHandle } from '@dungeonmaster/testing/register-mock';

import type { DirectoryEntryStub } from '@dungeonmaster/shared/contracts/directory-entry/directory-entry.stub';
import type { GuildIdStub } from '@dungeonmaster/shared/contracts/guild-id/guild-id.stub';
import type { GuildListItemStub } from '@dungeonmaster/shared/contracts/guild-list-item/guild-list-item.stub';
import type { QuestIdStub } from '@dungeonmaster/shared/contracts/quest-id/quest-id.stub';
import type { QuestListItemStub } from '@dungeonmaster/shared/contracts/quest-list-item/quest-list-item.stub';
import type { SessionListItemStub } from '@dungeonmaster/shared/contracts/session-list-item/session-list-item.stub';
import type { SkippedQuestFileStub } from '@dungeonmaster/shared/contracts/skipped-quest-file/skipped-quest-file.stub';

import * as questDeleteBrokerModule from '../../brokers/quest/delete/quest-delete-broker';

import { useGuildsBindingProxy } from '../../bindings/use-guilds/use-guilds-binding.proxy';
import { useQuestsBindingProxy } from '../../bindings/use-quests/use-quests-binding.proxy';
import { useSessionListBindingProxy } from '../../bindings/use-session-list/use-session-list-binding.proxy';
import { guildCreateBrokerProxy } from '../../brokers/guild/create/guild-create-broker.proxy';
import { questDeleteBrokerProxy } from '../../brokers/quest/delete/quest-delete-broker.proxy';
import { GuildAddModalWidgetProxy } from '../guild-add-modal/guild-add-modal-widget.proxy';
import { GuildEmptyStateWidgetProxy } from '../guild-empty-state/guild-empty-state-widget.proxy';
import { GuildListWidgetProxy } from '../guild-list/guild-list-widget.proxy';
import { GuildSessionListWidgetProxy } from '../guild-session-list/guild-session-list-widget.proxy';

import { userEventStatics } from '../../statics/user-event/user-event-statics';

type DirectoryEntry = ReturnType<typeof DirectoryEntryStub>;
type SessionListItem = ReturnType<typeof SessionListItemStub>;
type GuildListItem = ReturnType<typeof GuildListItemStub>;
type GuildId = ReturnType<typeof GuildIdStub>;
type QuestId = ReturnType<typeof QuestIdStub>;
type QuestListItem = ReturnType<typeof QuestListItemStub>;
type SkippedQuestFile = ReturnType<typeof SkippedQuestFileStub>;

export const HomeContentWidgetProxy = (): {
  setupGuilds: (params: { guilds: GuildListItem[] }) => void;
  setupDirectoryBrowse: (params: { entries: DirectoryEntry[] }) => void;
  setupGuildsError: () => void;
  setupCreateGuild: (params: { id: GuildId }) => void;
  setupSessions: (params: { sessions: SessionListItem[] }) => void;
  setupSessionsError: () => void;
  setupQuests: (params: { quests: QuestListItem[] }) => void;
  setupQuestsWithSkips: (params: { quests: QuestListItem[]; skipped: SkippedQuestFile[] }) => void;
  setupQuestsError: () => void;
  getUnreadableQuestRowTexts: () => readonly HTMLElement['textContent'][];
  getShowToastCalls: () => unknown[];
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
  isQueueLinkVisible: () => boolean;
  clickQueueLink: () => Promise<void>;
  getLoggedErrorsFor: (params: { message: string }) => RecordedCalls;
  storageWriteFails: (params: { key: string }) => void;
  storageRemoveFails: (params: { key: string }) => void;
  setupCreateGuildError: () => void;
  clearStorage: () => void;
  setupDeleteQuest: () => void;
  setupDeleteQuestRejectsWithMessage: (params: {
    questId: QuestId;
    guildId: GuildId;
    message: string;
  }) => void;
  setupDeleteQuestRejectsWithoutMessage: (params: { questId: QuestId; guildId: GuildId }) => void;
  clickDeleteButton: (params: { testId: string }) => Promise<void>;
  clickBanish: () => Promise<void>;
  isPopoverVisible: (params: { testId: string }) => boolean;
  getShownToast: () => unknown;
  getDeleteBrokerCalls: () => RecordedCalls;
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
  const isNotificationPayload = (payload: unknown): boolean =>
    typeof payload === 'object' && payload !== null;
  const notificationsHandle: MockHandle = registerMock({ fn: notifications.show });
  notificationsHandle.calledWith([isNotificationPayload]).returns(undefined);
  const guildList = GuildListWidgetProxy();
  const sessionList = GuildSessionListWidgetProxy();
  const emptyState = GuildEmptyStateWidgetProxy();
  const addModal = GuildAddModalWidgetProxy();
  // Records and silences every console.error line, so a test exercising a failing catch handler can
  // read back what was logged without it printing.
  const consoleProxy = consoleErrorProxy();
  readItemProxy();
  const storageWriteProxy = writeItemProxy();
  const storageRemoveProxy = removeItemProxy();

  return {
    // The empty-state form and the add-guild modal each mount a directory browser that lists a
    // directory on mount; both share one endpoint, so one staged listing answers them.
    setupDirectoryBrowse: ({ entries }: { entries: DirectoryEntry[] }): void => {
      emptyState.setupDirectoryBrowse({ entries });
      addModal.setupDirectoryBrowse({ entries });
    },
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
    setupQuestsWithSkips: ({
      quests,
      skipped,
    }: {
      quests: QuestListItem[];
      skipped: SkippedQuestFile[];
    }): void => {
      questsProxy.setupQuestsWithSkips({ quests, skipped });
    },
    getUnreadableQuestRowTexts: (): readonly HTMLElement['textContent'][] =>
      sessionList.getUnreadableQuestRowTexts(),
    getShowToastCalls: (): unknown[] => notificationsHandle.callsMatching([isNotificationPayload]),
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
      await userEvent.click(addButton, userEventStatics.options);
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
    isQueueLinkVisible: (): boolean => screen.queryByTestId('HOME_QUEUE_LINK') !== null,
    clickQueueLink: async (): Promise<void> => {
      await userEvent.click(screen.getByTestId('HOME_QUEUE_LINK'), userEventStatics.options);
    },
    getLoggedErrorsFor: ({ message }: { message: string }): RecordedCalls =>
      consoleProxy.getCallsFor({ message }),
    // Storage refuses every write (or removal) under this exact key, the way a private-mode browser
    // does.
    storageWriteFails: ({ key }: { key: string }): void => {
      storageWriteProxy.setupWriteFails({ key, error: StorageDisabledErrorStub() });
    },
    storageRemoveFails: ({ key }: { key: string }): void => {
      storageRemoveProxy.setupRemoveFails({ key, error: StorageDisabledErrorStub() });
    },
    setupCreateGuildError: (): void => {
      createGuildProxy.setupError();
    },
    setupDeleteQuest: (): void => {
      deleteQuestProxy.setupDelete();
    },
    setupDeleteQuestRejectsWithMessage: ({
      questId,
      guildId,
      message,
    }: {
      questId: QuestId;
      guildId: GuildId;
      message: string;
    }): void => {
      deleteBrokerSpy.calledWith([{ questId, guildId }]).implement(async () => {
        await Promise.resolve();
        throw new Error(message);
      });
    },
    setupDeleteQuestRejectsWithoutMessage: ({
      questId,
      guildId,
    }: {
      questId: QuestId;
      guildId: GuildId;
    }): void => {
      deleteBrokerSpy.calledWith([{ questId, guildId }]).implement(async () => {
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
    getShownToast: (): unknown =>
      notificationsHandle.callsMatching([isNotificationPayload]).at(-1)?.[0],
    getDeleteBrokerCalls: (): RecordedCalls => deleteBrokerSpy.callsMatching([]),
    clearStorage: (): void => {
      clear();
    },
  };
};
