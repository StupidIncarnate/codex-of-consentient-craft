import { screen } from '@testing-library/react';

import type {
  GuildIdStub,
  GuildListItemStub,
  QuestListItemStub,
} from '@dungeonmaster/shared/contracts';

import { useGuildsBindingProxy } from '../../bindings/use-guilds/use-guilds-binding.proxy';
import { useQuestsBindingProxy } from '../../bindings/use-quests/use-quests-binding.proxy';
import { guildCreateBrokerProxy } from '../../brokers/guild/create/guild-create-broker.proxy';
import { GuildAddModalWidgetProxy } from '../guild-add-modal/guild-add-modal-widget.proxy';
import { GuildEmptyStateWidgetProxy } from '../guild-empty-state/guild-empty-state-widget.proxy';
import { GuildListWidgetProxy } from '../guild-list/guild-list-widget.proxy';
import { GuildQuestListWidgetProxy } from '../guild-quest-list/guild-quest-list-widget.proxy';
import { LogoWidgetProxy } from '../logo/logo-widget.proxy';
import { MapFrameWidgetProxy } from '../map-frame/map-frame-widget.proxy';
import { QuestChatWidgetProxy } from '../quest-chat/quest-chat-widget.proxy';

type QuestListItem = ReturnType<typeof QuestListItemStub>;
type GuildListItem = ReturnType<typeof GuildListItemStub>;
type GuildId = ReturnType<typeof GuildIdStub>;

export const AppWidgetProxy = (): {
  setupGuilds: (params: { guilds: GuildListItem[] }) => void;
  setupGuildsError: () => void;
  setupCreateGuild: (params: { id: GuildId }) => void;
  setupDirectoryBrowse: (params: Parameters<typeof emptyState.setupDirectoryBrowse>[0]) => void;
  setupQuests: (params: { quests: QuestListItem[] }) => void;
  setupQuestsError: () => void;
  clickGuildItem: (params: { testId: string }) => Promise<void>;
  isGuildItemVisible: (params: { testId: string }) => boolean;
  isGuildItemSelected: (params: { testId: string }) => boolean;
  clickAddGuild: () => Promise<void>;
  isNewGuildTitleVisible: () => boolean;
  isQuestEmptyStateVisible: () => boolean;
  isSelectGuildMessageVisible: () => boolean;
  getQuestStatusText: (params: { testId: string }) => HTMLElement['textContent'];
  typeGuildName: (params: { value: string }) => Promise<void>;
  typeGuildPath: (params: { value: string }) => Promise<void>;
  getGuildPathValue: () => HTMLElement['textContent'];
  clickBrowseGuild: () => Promise<void>;
  clickCreateGuild: () => Promise<void>;
  clickCancelGuild: () => Promise<void>;
  clickDirectorySelect: () => Promise<void>;
  clickQuestItem: (params: { testId: string }) => Promise<void>;
  isQuestVisible: (params: { testId: string }) => boolean;
  typeGuildModalName: (params: { name: string }) => Promise<void>;
  clickBrowse: () => Promise<void>;
  clickCreateGuildSubmit: () => Promise<void>;
  clickCancelModal: () => Promise<void>;
  isCreateGuildDisabled: () => boolean;
  getPathDisplay: () => HTMLElement['textContent'];
  isQuestChatVisible: () => boolean;
} => {
  const questsProxy = useQuestsBindingProxy();
  const guildsProxy = useGuildsBindingProxy();
  const createGuildProxy = guildCreateBrokerProxy();
  LogoWidgetProxy();
  MapFrameWidgetProxy();
  const guildList = GuildListWidgetProxy();
  const questList = GuildQuestListWidgetProxy();
  const emptyState = GuildEmptyStateWidgetProxy();
  const addModal = GuildAddModalWidgetProxy();
  QuestChatWidgetProxy();

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
    setupDirectoryBrowse: (params: Parameters<typeof emptyState.setupDirectoryBrowse>[0]): void => {
      emptyState.setupDirectoryBrowse(params);
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
    isNewGuildTitleVisible: (): boolean => emptyState.isNewGuildTitleVisible(),
    isQuestEmptyStateVisible: (): boolean => questList.hasEmptyState(),
    isSelectGuildMessageVisible: (): boolean => screen.queryByText('Select a guild') !== null,
    getQuestStatusText: ({ testId }: { testId: string }): HTMLElement['textContent'] => {
      const element = screen.queryByTestId(testId);
      return element?.textContent ?? null;
    },
    typeGuildName: async ({ value }: { value: string }): Promise<void> => {
      await emptyState.typeGuildName({ value });
    },
    typeGuildPath: async ({ value }: { value: string }): Promise<void> => {
      await emptyState.typeGuildPath({ value });
    },
    getGuildPathValue: (): HTMLElement['textContent'] => emptyState.getGuildPathValue(),
    clickBrowseGuild: async (): Promise<void> => {
      await emptyState.clickBrowse();
    },
    clickCreateGuild: async (): Promise<void> => {
      await emptyState.clickCreate();
    },
    clickCancelGuild: async (): Promise<void> => {
      await emptyState.clickCancel();
    },
    clickDirectorySelect: async (): Promise<void> => {
      await emptyState.clickDirectorySelect();
    },
    clickQuestItem: async ({ testId }: { testId: string }): Promise<void> => {
      await questList.clickQuest({ testId });
    },
    isQuestVisible: ({ testId }: { testId: string }): boolean =>
      questList.isQuestVisible({ testId }),
    typeGuildModalName: async ({ name }: { name: string }): Promise<void> => {
      await addModal.typeName({ name });
    },
    clickBrowse: async (): Promise<void> => {
      await addModal.clickBrowse();
    },
    clickCreateGuildSubmit: async (): Promise<void> => {
      await addModal.clickCreate();
    },
    clickCancelModal: async (): Promise<void> => {
      await addModal.clickCancel();
    },
    isCreateGuildDisabled: (): boolean => addModal.isCreateDisabled(),
    getPathDisplay: (): HTMLElement['textContent'] => addModal.getPathDisplay(),
    isQuestChatVisible: (): boolean => screen.queryByTestId('QUEST_CHAT') !== null,
  };
};
