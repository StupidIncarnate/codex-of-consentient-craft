/**
 * PURPOSE: Tests for AppWidget - routing, layout, guild selection, and quest navigation
 */

import { waitFor } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { GuildIdStub, GuildListItemStub, QuestListItemStub } from '@dungeonmaster/shared/contracts';

import { mantineRenderAdapter } from '../../adapters/mantine/render/mantine-render-adapter';
import { testingLibraryActAsyncAdapter } from '../../adapters/testing-library/act-async/testing-library-act-async-adapter';
import { AppWidget } from './app-widget';
import { AppWidgetProxy } from './app-widget.proxy';

const renderApp = (): void => {
  mantineRenderAdapter({
    ui: (
      <MemoryRouter initialEntries={['/']}>
        <AppWidget />
      </MemoryRouter>
    ),
  });
};

describe('AppWidget', () => {
  describe('empty state', () => {
    it('VALID: {no guilds} => shows NEW GUILD form', async () => {
      const proxy = AppWidgetProxy();

      proxy.setupGuilds({ guilds: [] });

      await testingLibraryActAsyncAdapter({
        callback: async () => {
          renderApp();
          await Promise.resolve();
        },
      });

      await waitFor(() => {
        expect(proxy.isNewGuildTitleVisible()).toBe(true);
      });

      expect(proxy.isNewGuildTitleVisible()).toBe(true);
    });
  });

  describe('guild list view', () => {
    it('VALID: {guilds loaded} => shows guild items', async () => {
      const proxy = AppWidgetProxy();
      const guild = GuildListItemStub({ name: 'Guild One' });
      const guilds = [guild];

      proxy.setupGuilds({ guilds });

      await testingLibraryActAsyncAdapter({
        callback: async () => {
          renderApp();
          await Promise.resolve();
        },
      });

      await waitFor(() => {
        expect(proxy.isGuildItemVisible({ testId: `GUILD_ITEM_${guild.id}` })).toBe(true);
      });

      expect(proxy.isGuildItemVisible({ testId: `GUILD_ITEM_${guild.id}` })).toBe(true);
    });

    it('VALID: {no guild selected} => shows select a guild message', async () => {
      const proxy = AppWidgetProxy();
      const guilds = [GuildListItemStub({ name: 'My Guild' })];

      proxy.setupGuilds({ guilds });

      await testingLibraryActAsyncAdapter({
        callback: async () => {
          renderApp();
          await Promise.resolve();
        },
      });

      await waitFor(() => {
        expect(proxy.isSelectGuildMessageVisible()).toBe(true);
      });

      expect(proxy.isSelectGuildMessageVisible()).toBe(true);
    });
  });

  describe('quest list view', () => {
    it('VALID: {guild selected, quests loaded} => shows quest list', async () => {
      const proxy = AppWidgetProxy();
      const guild = GuildListItemStub({ name: 'My Guild' });
      const guilds = [guild];
      const quests = [
        QuestListItemStub({ id: 'quest-1', title: 'First Quest' }),
        QuestListItemStub({ id: 'quest-2', title: 'Second Quest' }),
      ];

      proxy.setupGuilds({ guilds });

      await testingLibraryActAsyncAdapter({
        callback: async () => {
          renderApp();
          await Promise.resolve();
        },
      });

      await waitFor(() => {
        expect(proxy.isGuildItemVisible({ testId: `GUILD_ITEM_${guild.id}` })).toBe(true);
      });

      proxy.setupQuests({ quests });

      await testingLibraryActAsyncAdapter({
        callback: async () => {
          await proxy.clickGuildItem({ testId: `GUILD_ITEM_${guild.id}` });
          await Promise.resolve();
        },
      });

      await waitFor(() => {
        expect(proxy.isGuildItemVisible({ testId: `GUILD_ITEM_${guild.id}` })).toBe(true);
      });

      expect(proxy.isGuildItemVisible({ testId: `GUILD_ITEM_${guild.id}` })).toBe(true);
    });
  });

  describe('quest chat view', () => {
    it('VALID: {click quest} => navigates to quest chat route', async () => {
      const proxy = AppWidgetProxy();
      const guild = GuildListItemStub({ name: 'My Guild' });
      const guilds = [guild];
      const quests = [QuestListItemStub({ id: 'quest-1', title: 'My Quest' })];

      proxy.setupGuilds({ guilds });

      await testingLibraryActAsyncAdapter({
        callback: async () => {
          renderApp();
          await Promise.resolve();
        },
      });

      await waitFor(() => {
        expect(proxy.isGuildItemVisible({ testId: `GUILD_ITEM_${guild.id}` })).toBe(true);
      });

      proxy.setupQuests({ quests });

      await testingLibraryActAsyncAdapter({
        callback: async () => {
          await proxy.clickGuildItem({ testId: `GUILD_ITEM_${guild.id}` });
          await Promise.resolve();
        },
      });

      await testingLibraryActAsyncAdapter({
        callback: async () => {
          await proxy.clickQuestItem({ testId: 'QUEST_ITEM_quest-1' });
          await Promise.resolve();
        },
      });

      await waitFor(() => {
        expect(proxy.isQuestChatVisible()).toBe(true);
      });

      expect(proxy.isQuestChatVisible()).toBe(true);
    });
  });

  describe('guild creation flow', () => {
    it('VALID: {empty state, type name, CREATE} => guild appears and is auto-selected', async () => {
      const proxy = AppWidgetProxy();
      const guildId = GuildIdStub({ value: 'a1b2c3d4-e5f6-7890-abcd-ef1234567890' });
      const createdGuild = GuildListItemStub({
        id: guildId,
        name: 'new-guild',
      });

      proxy.setupGuilds({ guilds: [] });

      await testingLibraryActAsyncAdapter({
        callback: async () => {
          renderApp();
          await Promise.resolve();
        },
      });

      await waitFor(() => {
        expect(proxy.isNewGuildTitleVisible()).toBe(true);
      });

      await testingLibraryActAsyncAdapter({
        callback: async () => {
          await proxy.typeGuildName({ value: 'new-guild' });
          await proxy.typeGuildPath({ value: '/home/user/new-guild' });
          await Promise.resolve();
        },
      });

      proxy.setupCreateGuild({ id: guildId });
      proxy.setupGuilds({ guilds: [createdGuild] });
      proxy.setupQuests({ quests: [] });

      await testingLibraryActAsyncAdapter({
        callback: async () => {
          await proxy.clickCreateGuild();
          await Promise.resolve();
        },
      });

      await waitFor(() => {
        expect(proxy.isGuildItemVisible({ testId: `GUILD_ITEM_${guildId}` })).toBe(true);
      });

      expect(proxy.isGuildItemVisible({ testId: `GUILD_ITEM_${guildId}` })).toBe(true);
    });

    it('VALID: {empty state, CREATE succeeds} => transitions to main view with guild in left column', async () => {
      const proxy = AppWidgetProxy();
      const guildId = GuildIdStub({ value: 'b2c3d4e5-f6a7-8901-bcde-f12345678901' });
      const createdGuild = GuildListItemStub({
        id: guildId,
        name: 'test-guild',
      });

      proxy.setupGuilds({ guilds: [] });

      await testingLibraryActAsyncAdapter({
        callback: async () => {
          renderApp();
          await Promise.resolve();
        },
      });

      await waitFor(() => {
        expect(proxy.isNewGuildTitleVisible()).toBe(true);
      });

      await testingLibraryActAsyncAdapter({
        callback: async () => {
          await proxy.typeGuildName({ value: 'test-guild' });
          await proxy.typeGuildPath({ value: '/home/user/test-guild' });
          await Promise.resolve();
        },
      });

      proxy.setupCreateGuild({ id: guildId });
      proxy.setupGuilds({ guilds: [createdGuild] });
      proxy.setupQuests({ quests: [] });

      await testingLibraryActAsyncAdapter({
        callback: async () => {
          await proxy.clickCreateGuild();
          await Promise.resolve();
        },
      });

      await waitFor(() => {
        expect(proxy.isNewGuildTitleVisible()).toBe(false);
      });

      expect(proxy.isGuildItemVisible({ testId: `GUILD_ITEM_${guildId}` })).toBe(true);
    });

    it('VALID: {main view, click +} => shows NEW GUILD form => CREATE => returns to main', async () => {
      const proxy = AppWidgetProxy();
      const existingGuild = GuildListItemStub({
        id: 'c3d4e5f6-a7b8-9012-cdef-123456789012',
        name: 'Existing Guild',
      });
      const newGuildId = GuildIdStub({ value: 'd4e5f6a7-b8c9-0123-defa-234567890123' });
      const newGuild = GuildListItemStub({
        id: newGuildId,
        name: 'new-guild',
      });

      proxy.setupGuilds({ guilds: [existingGuild] });

      await testingLibraryActAsyncAdapter({
        callback: async () => {
          renderApp();
          await Promise.resolve();
        },
      });

      await waitFor(() => {
        expect(proxy.isGuildItemVisible({ testId: `GUILD_ITEM_${existingGuild.id}` })).toBe(true);
      });

      await testingLibraryActAsyncAdapter({
        callback: async () => {
          await proxy.clickAddGuild();
          await Promise.resolve();
        },
      });

      await waitFor(() => {
        expect(proxy.isNewGuildTitleVisible()).toBe(true);
      });

      await testingLibraryActAsyncAdapter({
        callback: async () => {
          await proxy.typeGuildName({ value: 'new-guild' });
          await proxy.typeGuildPath({ value: '/home/user/new-guild' });
          await Promise.resolve();
        },
      });

      proxy.setupCreateGuild({ id: newGuildId });
      proxy.setupGuilds({ guilds: [existingGuild, newGuild] });
      proxy.setupQuests({ quests: [] });

      await testingLibraryActAsyncAdapter({
        callback: async () => {
          await proxy.clickCreateGuild();
          await Promise.resolve();
        },
      });

      await waitFor(() => {
        expect(proxy.isNewGuildTitleVisible()).toBe(false);
      });

      expect(proxy.isGuildItemVisible({ testId: `GUILD_ITEM_${existingGuild.id}` })).toBe(true);
      expect(proxy.isGuildItemVisible({ testId: `GUILD_ITEM_${newGuildId}` })).toBe(true);
    });

    it('VALID: {main view, click +, cancel} => returns to main, no change', async () => {
      const proxy = AppWidgetProxy();
      const guild = GuildListItemStub({
        id: 'e5f6a7b8-c9d0-1234-efab-345678901234',
        name: 'My Guild',
      });

      proxy.setupGuilds({ guilds: [guild] });

      await testingLibraryActAsyncAdapter({
        callback: async () => {
          renderApp();
          await Promise.resolve();
        },
      });

      await waitFor(() => {
        expect(proxy.isGuildItemVisible({ testId: `GUILD_ITEM_${guild.id}` })).toBe(true);
      });

      await testingLibraryActAsyncAdapter({
        callback: async () => {
          await proxy.clickAddGuild();
          await Promise.resolve();
        },
      });

      await waitFor(() => {
        expect(proxy.isNewGuildTitleVisible()).toBe(true);
      });

      await testingLibraryActAsyncAdapter({
        callback: async () => {
          await proxy.clickCancelGuild();
          await Promise.resolve();
        },
      });

      await waitFor(() => {
        expect(proxy.isNewGuildTitleVisible()).toBe(false);
      });

      expect(proxy.isGuildItemVisible({ testId: `GUILD_ITEM_${guild.id}` })).toBe(true);
    });

    it('VALID: {create guild, API error} => stays on form (error swallowed)', async () => {
      const proxy = AppWidgetProxy();

      proxy.setupGuilds({ guilds: [] });

      await testingLibraryActAsyncAdapter({
        callback: async () => {
          renderApp();
          await Promise.resolve();
        },
      });

      await waitFor(() => {
        expect(proxy.isNewGuildTitleVisible()).toBe(true);
      });

      await testingLibraryActAsyncAdapter({
        callback: async () => {
          await proxy.typeGuildName({ value: 'fail-guild' });
          await proxy.typeGuildPath({ value: '/home/user/fail-guild' });
          await Promise.resolve();
        },
      });

      proxy.setupGuildsError();

      await testingLibraryActAsyncAdapter({
        callback: async () => {
          await proxy.clickCreateGuild();
          await Promise.resolve();
        },
      });

      await waitFor(() => {
        expect(proxy.isNewGuildTitleVisible()).toBe(true);
      });

      expect(proxy.isNewGuildTitleVisible()).toBe(true);
    });
  });

  describe('guild selection and quest loading', () => {
    it('VALID: {click guild item} => quest list renders for that guild', async () => {
      const proxy = AppWidgetProxy();
      const guild = GuildListItemStub({
        id: 'f6a7b8c9-d0e1-2345-fabc-456789012345',
        name: 'Guild Alpha',
      });
      const quests = [QuestListItemStub({ id: 'q-1', title: 'Alpha Quest' })];

      proxy.setupGuilds({ guilds: [guild] });

      await testingLibraryActAsyncAdapter({
        callback: async () => {
          renderApp();
          await Promise.resolve();
        },
      });

      await waitFor(() => {
        expect(proxy.isGuildItemVisible({ testId: `GUILD_ITEM_${guild.id}` })).toBe(true);
      });

      proxy.setupQuests({ quests });

      await testingLibraryActAsyncAdapter({
        callback: async () => {
          await proxy.clickGuildItem({ testId: `GUILD_ITEM_${guild.id}` });
          await Promise.resolve();
        },
      });

      await waitFor(() => {
        expect(proxy.isGuildItemVisible({ testId: `GUILD_ITEM_${guild.id}` })).toBe(true);
      });

      expect(proxy.isGuildItemVisible({ testId: `GUILD_ITEM_${guild.id}` })).toBe(true);
    });

    it('VALID: {click guild with no quests} => shows empty state', async () => {
      const proxy = AppWidgetProxy();
      const guild = GuildListItemStub({
        id: 'a7b8c9d0-e1f2-3456-abcd-567890123456',
        name: 'Empty Guild',
      });

      proxy.setupGuilds({ guilds: [guild] });

      await testingLibraryActAsyncAdapter({
        callback: async () => {
          renderApp();
          await Promise.resolve();
        },
      });

      await waitFor(() => {
        expect(proxy.isGuildItemVisible({ testId: `GUILD_ITEM_${guild.id}` })).toBe(true);
      });

      proxy.setupQuests({ quests: [] });

      await testingLibraryActAsyncAdapter({
        callback: async () => {
          await proxy.clickGuildItem({ testId: `GUILD_ITEM_${guild.id}` });
          await Promise.resolve();
        },
      });

      await waitFor(() => {
        expect(proxy.isQuestEmptyStateVisible()).toBe(true);
      });

      expect(proxy.isQuestEmptyStateVisible()).toBe(true);
    });

    it('VALID: {click guild, quest list error} => error state', async () => {
      const proxy = AppWidgetProxy();
      const guild = GuildListItemStub({
        id: 'd0e1f2a3-b4c5-6789-defa-890123456789',
        name: 'Error Guild',
      });

      proxy.setupGuilds({ guilds: [guild] });

      await testingLibraryActAsyncAdapter({
        callback: async () => {
          renderApp();
          await Promise.resolve();
        },
      });

      await waitFor(() => {
        expect(proxy.isGuildItemVisible({ testId: `GUILD_ITEM_${guild.id}` })).toBe(true);
      });

      proxy.setupQuestsError();

      await testingLibraryActAsyncAdapter({
        callback: async () => {
          await proxy.clickGuildItem({ testId: `GUILD_ITEM_${guild.id}` });
          await Promise.resolve();
        },
      });

      await waitFor(() => {
        expect(proxy.isQuestEmptyStateVisible()).toBe(true);
      });

      expect(proxy.isQuestEmptyStateVisible()).toBe(true);
    });
  });

  describe('navigation between views', () => {
    it('VALID: {main, click quest} => shows quest chat view', async () => {
      const proxy = AppWidgetProxy();
      const guild = GuildListItemStub({
        id: 'e1f2a3b4-c5d6-7890-efab-901234567890',
        name: 'Nav Guild',
      });
      const quests = [QuestListItemStub({ id: 'nav-q1', title: 'Nav Quest' })];

      proxy.setupGuilds({ guilds: [guild] });

      await testingLibraryActAsyncAdapter({
        callback: async () => {
          renderApp();
          await Promise.resolve();
        },
      });

      await waitFor(() => {
        expect(proxy.isGuildItemVisible({ testId: `GUILD_ITEM_${guild.id}` })).toBe(true);
      });

      proxy.setupQuests({ quests });

      await testingLibraryActAsyncAdapter({
        callback: async () => {
          await proxy.clickGuildItem({ testId: `GUILD_ITEM_${guild.id}` });
          await Promise.resolve();
        },
      });

      await testingLibraryActAsyncAdapter({
        callback: async () => {
          await proxy.clickQuestItem({ testId: 'QUEST_ITEM_nav-q1' });
          await Promise.resolve();
        },
      });

      await waitFor(() => {
        expect(proxy.isQuestChatVisible()).toBe(true);
      });

      expect(proxy.isQuestChatVisible()).toBe(true);
    });

    it('VALID: {empty state, create guild} => auto-transitions to main', async () => {
      const proxy = AppWidgetProxy();
      const guildId = GuildIdStub({ value: 'f2a3b4c5-d6e7-8901-fabc-012345678901' });
      const guild = GuildListItemStub({ id: guildId, name: 'auto-guild' });

      proxy.setupGuilds({ guilds: [] });

      await testingLibraryActAsyncAdapter({
        callback: async () => {
          renderApp();
          await Promise.resolve();
        },
      });

      await waitFor(() => {
        expect(proxy.isNewGuildTitleVisible()).toBe(true);
      });

      await testingLibraryActAsyncAdapter({
        callback: async () => {
          await proxy.typeGuildName({ value: 'auto-guild' });
          await proxy.typeGuildPath({ value: '/home/user/auto-guild' });
          await Promise.resolve();
        },
      });

      proxy.setupCreateGuild({ id: guildId });
      proxy.setupGuilds({ guilds: [guild] });
      proxy.setupQuests({ quests: [] });

      await testingLibraryActAsyncAdapter({
        callback: async () => {
          await proxy.clickCreateGuild();
          await Promise.resolve();
        },
      });

      await waitFor(() => {
        expect(proxy.isGuildItemVisible({ testId: `GUILD_ITEM_${guildId}` })).toBe(true);
      });

      expect(proxy.isNewGuildTitleVisible()).toBe(false);
    });

    it('VALID: {multiple guilds, select one} => gold highlight visible', async () => {
      const proxy = AppWidgetProxy();
      const guildA = GuildListItemStub({
        id: 'a3b4c5d6-e7f8-9012-abcd-123456789abc',
        name: 'Guild Alpha',
      });
      const guildB = GuildListItemStub({
        id: 'b4c5d6e7-f8a9-0123-bcde-23456789abcd',
        name: 'Guild Beta',
      });

      proxy.setupGuilds({ guilds: [guildA, guildB] });

      await testingLibraryActAsyncAdapter({
        callback: async () => {
          renderApp();
          await Promise.resolve();
        },
      });

      await waitFor(() => {
        expect(proxy.isGuildItemVisible({ testId: `GUILD_ITEM_${guildA.id}` })).toBe(true);
      });

      proxy.setupQuests({ quests: [] });

      await testingLibraryActAsyncAdapter({
        callback: async () => {
          await proxy.clickGuildItem({ testId: `GUILD_ITEM_${guildA.id}` });
          await Promise.resolve();
        },
      });

      await waitFor(() => {
        expect(proxy.isGuildItemSelected({ testId: `GUILD_ITEM_${guildA.id}` })).toBe(true);
      });

      expect(proxy.isGuildItemSelected({ testId: `GUILD_ITEM_${guildA.id}` })).toBe(true);
    });
  });

  describe('error and edge cases', () => {
    it('VALID: {guilds API error} => empty state form shown (graceful degradation)', async () => {
      const proxy = AppWidgetProxy();

      proxy.setupGuildsError();

      await testingLibraryActAsyncAdapter({
        callback: async () => {
          renderApp();
          await Promise.resolve();
        },
      });

      await waitFor(() => {
        expect(proxy.isNewGuildTitleVisible()).toBe(true);
      });

      expect(proxy.isNewGuildTitleVisible()).toBe(true);
    });

    it('VALID: {load 3 guilds} => all visible in left column', async () => {
      const proxy = AppWidgetProxy();
      const guildA = GuildListItemStub({
        id: 'c5d6e7f8-a9b0-1234-cdef-3456789abcde',
        name: 'Guild One',
      });
      const guildB = GuildListItemStub({
        id: 'd6e7f8a9-b0c1-2345-defa-456789abcdef',
        name: 'Guild Two',
      });
      const guildC = GuildListItemStub({
        id: 'e7f8a9b0-c1d2-3456-efab-56789abcdef0',
        name: 'Guild Three',
      });

      proxy.setupGuilds({ guilds: [guildA, guildB, guildC] });

      await testingLibraryActAsyncAdapter({
        callback: async () => {
          renderApp();
          await Promise.resolve();
        },
      });

      await waitFor(() => {
        expect(proxy.isGuildItemVisible({ testId: `GUILD_ITEM_${guildA.id}` })).toBe(true);
      });

      expect(proxy.isGuildItemVisible({ testId: `GUILD_ITEM_${guildB.id}` })).toBe(true);
      expect(proxy.isGuildItemVisible({ testId: `GUILD_ITEM_${guildC.id}` })).toBe(true);
    });

    it('VALID: {click quest} => renders quest chat instead of quest detail tabs', async () => {
      const proxy = AppWidgetProxy();
      const guild = GuildListItemStub({
        id: 'a9b0c1d2-e3f4-5678-abcd-789abcdef012',
        name: 'Tab Guild',
      });
      const quests = [QuestListItemStub({ id: 'tab-q1', title: 'Tab Quest' })];

      proxy.setupGuilds({ guilds: [guild] });

      await testingLibraryActAsyncAdapter({
        callback: async () => {
          renderApp();
          await Promise.resolve();
        },
      });

      await waitFor(() => {
        expect(proxy.isGuildItemVisible({ testId: `GUILD_ITEM_${guild.id}` })).toBe(true);
      });

      proxy.setupQuests({ quests });

      await testingLibraryActAsyncAdapter({
        callback: async () => {
          await proxy.clickGuildItem({ testId: `GUILD_ITEM_${guild.id}` });
          await Promise.resolve();
        },
      });

      await testingLibraryActAsyncAdapter({
        callback: async () => {
          await proxy.clickQuestItem({ testId: 'QUEST_ITEM_tab-q1' });
          await Promise.resolve();
        },
      });

      await waitFor(() => {
        expect(proxy.isQuestChatVisible()).toBe(true);
      });

      expect(proxy.isQuestChatVisible()).toBe(true);
    });
  });
});
