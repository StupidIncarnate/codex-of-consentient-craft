/**
 * PURPOSE: Test proxy for HomeContentLayerWidget - sets up mocks for guilds, quests, and guild creation
 *
 * USAGE:
 * const proxy = HomeContentLayerWidgetProxy();
 * proxy.setupGuilds({ guilds: [] });
 */

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

type QuestListItem = ReturnType<typeof QuestListItemStub>;
type GuildListItem = ReturnType<typeof GuildListItemStub>;
type GuildId = ReturnType<typeof GuildIdStub>;

export const HomeContentLayerWidgetProxy = (): {
  setupGuilds: (params: { guilds: GuildListItem[] }) => void;
  setupGuildsError: () => void;
  setupCreateGuild: (params: { id: GuildId }) => void;
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
  clickCreateGuild: () => Promise<void>;
  clickCancelGuild: () => Promise<void>;
  clickQuestItem: (params: { testId: string }) => Promise<void>;
} => {
  const questsProxy = useQuestsBindingProxy();
  const guildsProxy = useGuildsBindingProxy();
  const createGuildProxy = guildCreateBrokerProxy();
  const guildList = GuildListWidgetProxy();
  const questList = GuildQuestListWidgetProxy();
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
    clickCreateGuild: async (): Promise<void> => {
      await emptyState.clickCreate();
    },
    clickCancelGuild: async (): Promise<void> => {
      await emptyState.clickCancel();
    },
    clickQuestItem: async ({ testId }: { testId: string }): Promise<void> => {
      await questList.clickQuest({ testId });
    },
  };
};
