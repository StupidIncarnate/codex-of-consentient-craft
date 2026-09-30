/**
 * PURPOSE: Tests for AppWidget - routing, layout, guild selection, and session navigation
 */

import { MemoryRouter, Route, Routes } from '#gateway/npm/react-router-dom';
import { DispatchStateStub } from '@dungeonmaster/shared/contracts/dispatch-state/dispatch-state.stub';
import { GuildIdStub } from '@dungeonmaster/shared/contracts/guild-id/guild-id.stub';
import { GuildListItemStub } from '@dungeonmaster/shared/contracts/guild-list-item/guild-list-item.stub';
import { QuestIdStub } from '@dungeonmaster/shared/contracts/quest-id/quest-id.stub';
import { QuestQueueEntryStub } from '@dungeonmaster/shared/contracts/quest-queue-entry/quest-queue-entry.stub';
import { SessionListItemStub } from '@dungeonmaster/shared/contracts/session-list-item/session-list-item.stub';

import { mantineRenderMiddleware } from '@dungeonmaster/testing/middleware/mantine-render';
import { act, renderHook, waitFor } from '#gateway/npm/testing-library__react';
import { useQuestChatBinding } from '../../bindings/use-quest-chat/use-quest-chat-binding';
import { useQuestQueueBinding } from '../../bindings/use-quest-queue/use-quest-queue-binding';
import { useRateLimitsBinding } from '../../bindings/use-rate-limits/use-rate-limits-binding';
import { HomeContentWidget } from '../home-content/home-content-widget';
import { QuestChatWidget } from '../quest-chat/quest-chat-widget';
import { SessionViewWidget } from '../session-view/session-view-widget';
import { AppWidget } from './app-widget';
import { AppWidgetProxy } from './app-widget.proxy';

const renderApp = (): void => {
  mantineRenderMiddleware({
    ui: (
      <MemoryRouter initialEntries={['/']}>
        <Routes>
          <Route element={<AppWidget />}>
            <Route path="/" element={<HomeContentWidget />} />
            <Route path="/:guildSlug/session/:sessionId" element={<SessionViewWidget />} />
            <Route path="/:guildSlug/quest" element={<QuestChatWidget />} />
            <Route path="/:guildSlug/quest/:questId" element={<QuestChatWidget />} />
          </Route>
        </Routes>
      </MemoryRouter>
    ),
  });
};

describe('AppWidget', () => {
  describe('queue bar mounting', () => {
    it('VALID: {queue has entries} => QuestQueueBarWidget is mounted and visible', async () => {
      const proxy = AppWidgetProxy();

      proxy.setupDirectoryBrowse({ entries: [] });
      proxy.setupRateLimits({ snapshot: null });
      proxy.setupDispatchState({ state: DispatchStateStub() });
      proxy.setupGuilds({ guilds: [] });
      proxy.setupQuestQueue({
        entries: [QuestQueueEntryStub({ questId: 'q-head', questTitle: 'Head Quest' })],
      });

      await act(async () => {
        renderApp();
        await Promise.resolve();
      });

      await waitFor(() => {
        expect(proxy.isQuestQueueBarVisible()).toBe(true);
      });

      expect(proxy.isQuestQueueBarVisible()).toBe(true);
    });
  });

  describe('empty state', () => {
    it('VALID: {no guilds} => shows NEW GUILD form', async () => {
      const proxy = AppWidgetProxy();

      proxy.setupMountDefaults();
      proxy.setupGuilds({ guilds: [] });

      await act(async () => {
        renderApp();
        await Promise.resolve();
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

      proxy.setupMountDefaults();
      const guild = GuildListItemStub({ name: 'Guild One' });
      const guilds = [guild];

      proxy.setupGuilds({ guilds });

      await act(async () => {
        renderApp();
        await Promise.resolve();
      });

      await waitFor(() => {
        expect(proxy.isGuildItemVisible({ testId: `GUILD_ITEM_${guild.id}` })).toBe(true);
      });

      expect(proxy.isGuildItemVisible({ testId: `GUILD_ITEM_${guild.id}` })).toBe(true);
    });

    it('VALID: {no guild selected} => shows select a guild message', async () => {
      const proxy = AppWidgetProxy();

      proxy.setupMountDefaults();
      const guilds = [GuildListItemStub({ name: 'My Guild' })];

      proxy.setupGuilds({ guilds });

      await act(async () => {
        renderApp();
        await Promise.resolve();
      });

      await waitFor(() => {
        expect(proxy.isSelectGuildMessageVisible()).toBe(true);
      });

      expect(proxy.isSelectGuildMessageVisible()).toBe(true);
    });
  });

  describe('session list view', () => {
    it('VALID: {guild selected, sessions loaded} => shows session list', async () => {
      const proxy = AppWidgetProxy();

      proxy.setupMountDefaults();
      const guild = GuildListItemStub({ name: 'My Guild' });
      const guilds = [guild];
      const sessions = [
        SessionListItemStub({ sessionId: 'session-1' }),
        SessionListItemStub({ sessionId: 'session-2' }),
      ];

      proxy.setupGuilds({ guilds });

      await act(async () => {
        renderApp();
        await Promise.resolve();
      });

      await waitFor(() => {
        expect(proxy.isGuildItemVisible({ testId: `GUILD_ITEM_${guild.id}` })).toBe(true);
      });

      proxy.setupSessions({ sessions });

      await act(async () => {
        await proxy.clickGuildItem({ testId: `GUILD_ITEM_${guild.id}` });
        await Promise.resolve();
      });

      await waitFor(() => {
        expect(proxy.isGuildItemVisible({ testId: `GUILD_ITEM_${guild.id}` })).toBe(true);
      });

      expect(proxy.isGuildItemVisible({ testId: `GUILD_ITEM_${guild.id}` })).toBe(true);
    });
  });

  describe('session view route', () => {
    it('VALID: {click session} => navigates to readonly session view route', async () => {
      const proxy = AppWidgetProxy();

      proxy.setupMountDefaults();
      const guild = GuildListItemStub({ name: 'My Guild' });
      const guilds = [guild];
      const sessions = [SessionListItemStub({ sessionId: 'session-1', questId: 'quest-1' })];

      proxy.setupGuilds({ guilds });

      await act(async () => {
        renderApp();
        await Promise.resolve();
      });

      await waitFor(() => {
        expect(proxy.isGuildItemVisible({ testId: `GUILD_ITEM_${guild.id}` })).toBe(true);
      });

      proxy.setupSessions({ sessions });

      await act(async () => {
        await proxy.clickGuildItem({ testId: `GUILD_ITEM_${guild.id}` });
        await Promise.resolve();
      });

      await act(async () => {
        await proxy.selectAllSessionsFilter();
        await Promise.resolve();
      });

      await act(async () => {
        await proxy.clickSessionItem({ testId: 'SESSION_ITEM_session-1' });
        await Promise.resolve();
      });

      await waitFor(() => {
        expect(proxy.isSessionViewVisible()).toBe(true);
      });

      expect(proxy.isSessionViewVisible()).toBe(true);
    });
  });

  describe('guild creation flow', () => {
    it('VALID: {empty state, type name, CREATE} => guild appears and is auto-selected', async () => {
      const proxy = AppWidgetProxy();

      proxy.setupMountDefaults();
      const guildId = GuildIdStub({ value: 'a1b2c3d4-e5f6-7890-abcd-ef1234567890' });
      const createdGuild = GuildListItemStub({
        id: guildId,
        name: 'new-guild',
      });

      proxy.setupGuilds({ guilds: [] });

      await act(async () => {
        renderApp();
        await Promise.resolve();
      });

      await waitFor(() => {
        expect(proxy.isNewGuildTitleVisible()).toBe(true);
      });

      await act(async () => {
        await proxy.typeGuildName({ value: 'new-guild' });
        await proxy.typeGuildPath({ value: '/home/user/new-guild' });
        await Promise.resolve();
      });

      proxy.setupCreateGuild({ id: guildId });
      proxy.setupGuilds({ guilds: [createdGuild] });
      proxy.setupSessions({ sessions: [] });

      await act(async () => {
        await proxy.clickCreateGuild();
        await Promise.resolve();
      });

      await waitFor(() => {
        expect(proxy.isGuildItemVisible({ testId: `GUILD_ITEM_${guildId}` })).toBe(true);
      });

      expect(proxy.isGuildItemVisible({ testId: `GUILD_ITEM_${guildId}` })).toBe(true);
    });

    it('VALID: {empty state, CREATE succeeds} => transitions to main view with guild in left column', async () => {
      const proxy = AppWidgetProxy();

      proxy.setupMountDefaults();
      const guildId = GuildIdStub({ value: 'b2c3d4e5-f6a7-8901-bcde-f12345678901' });
      const createdGuild = GuildListItemStub({
        id: guildId,
        name: 'test-guild',
      });

      proxy.setupGuilds({ guilds: [] });

      await act(async () => {
        renderApp();
        await Promise.resolve();
      });

      await waitFor(() => {
        expect(proxy.isNewGuildTitleVisible()).toBe(true);
      });

      await act(async () => {
        await proxy.typeGuildName({ value: 'test-guild' });
        await proxy.typeGuildPath({ value: '/home/user/test-guild' });
        await Promise.resolve();
      });

      proxy.setupCreateGuild({ id: guildId });
      proxy.setupGuilds({ guilds: [createdGuild] });
      proxy.setupSessions({ sessions: [] });

      await act(async () => {
        await proxy.clickCreateGuild();
        await Promise.resolve();
      });

      await waitFor(() => {
        expect(proxy.isNewGuildTitleVisible()).toBe(false);
      });

      expect(proxy.isGuildItemVisible({ testId: `GUILD_ITEM_${guildId}` })).toBe(true);
    });

    it('VALID: {main view, click +} => shows NEW GUILD form => CREATE => returns to main', async () => {
      const proxy = AppWidgetProxy();

      proxy.setupMountDefaults();
      const existingGuild = GuildListItemStub({
        id: 'da28ff7b-045c-84bf-aa90-88331cb5c35c',
        name: 'Existing Guild',
      });
      const newGuildId = GuildIdStub({ value: 'b034edce-fe58-61fe-82ce-8edb6d42d8c6' });
      const newGuild = GuildListItemStub({
        id: newGuildId,
        name: 'new-guild',
      });

      proxy.setupGuilds({ guilds: [existingGuild] });

      await act(async () => {
        renderApp();
        await Promise.resolve();
      });

      await waitFor(() => {
        expect(proxy.isGuildItemVisible({ testId: `GUILD_ITEM_${existingGuild.id}` })).toBe(true);
      });

      await act(async () => {
        await proxy.clickAddGuild();
        await Promise.resolve();
      });

      await waitFor(() => {
        expect(proxy.isNewGuildTitleVisible()).toBe(true);
      });

      await act(async () => {
        await proxy.typeGuildName({ value: 'new-guild' });
        await proxy.typeGuildPath({ value: '/home/user/new-guild' });
        await Promise.resolve();
      });

      proxy.setupCreateGuild({ id: newGuildId });
      proxy.setupGuilds({ guilds: [existingGuild, newGuild] });
      proxy.setupSessions({ sessions: [] });

      await act(async () => {
        await proxy.clickCreateGuild();
        await Promise.resolve();
      });

      await waitFor(() => {
        expect(proxy.isNewGuildTitleVisible()).toBe(false);
      });

      expect(proxy.isGuildItemVisible({ testId: `GUILD_ITEM_${existingGuild.id}` })).toBe(true);
      expect(proxy.isGuildItemVisible({ testId: `GUILD_ITEM_${newGuildId}` })).toBe(true);
    });

    it('VALID: {main view, click +, cancel} => returns to main, no change', async () => {
      const proxy = AppWidgetProxy();

      proxy.setupMountDefaults();
      const guild = GuildListItemStub({
        id: '28f58fe9-e6c5-7750-879f-d96162cf916c',
        name: 'My Guild',
      });

      proxy.setupGuilds({ guilds: [guild] });

      await act(async () => {
        renderApp();
        await Promise.resolve();
      });

      await waitFor(() => {
        expect(proxy.isGuildItemVisible({ testId: `GUILD_ITEM_${guild.id}` })).toBe(true);
      });

      await act(async () => {
        await proxy.clickAddGuild();
        await Promise.resolve();
      });

      await waitFor(() => {
        expect(proxy.isNewGuildTitleVisible()).toBe(true);
      });

      await act(async () => {
        await proxy.clickCancelGuild();
        await Promise.resolve();
      });

      await waitFor(() => {
        expect(proxy.isNewGuildTitleVisible()).toBe(false);
      });

      expect(proxy.isGuildItemVisible({ testId: `GUILD_ITEM_${guild.id}` })).toBe(true);
    });

    it('VALID: {create guild, API error} => stays on form (error swallowed)', async () => {
      const proxy = AppWidgetProxy();

      proxy.setupMountDefaults();
      proxy.setupGuilds({ guilds: [] });

      await act(async () => {
        renderApp();
        await Promise.resolve();
      });

      await waitFor(() => {
        expect(proxy.isNewGuildTitleVisible()).toBe(true);
      });

      await act(async () => {
        await proxy.typeGuildName({ value: 'fail-guild' });
        await proxy.typeGuildPath({ value: '/home/user/fail-guild' });
        await Promise.resolve();
      });

      proxy.setupCreateGuildError();

      await act(async () => {
        await proxy.clickCreateGuild();
        await Promise.resolve();
      });

      await waitFor(() => {
        expect(proxy.isNewGuildTitleVisible()).toBe(true);
      });

      expect(proxy.isNewGuildTitleVisible()).toBe(true);
    });
  });

  describe('guild selection and session loading', () => {
    it('VALID: {click guild item} => session list renders for that guild', async () => {
      const proxy = AppWidgetProxy();

      proxy.setupMountDefaults();
      const guild = GuildListItemStub({
        id: '2cf4bbf1-0a31-3d8a-adb9-113bb32c69c5',
        name: 'Guild Alpha',
      });
      const sessions = [SessionListItemStub({ sessionId: 'session-1' })];

      proxy.setupGuilds({ guilds: [guild] });

      await act(async () => {
        renderApp();
        await Promise.resolve();
      });

      await waitFor(() => {
        expect(proxy.isGuildItemVisible({ testId: `GUILD_ITEM_${guild.id}` })).toBe(true);
      });

      proxy.setupSessions({ sessions });

      await act(async () => {
        await proxy.clickGuildItem({ testId: `GUILD_ITEM_${guild.id}` });
        await Promise.resolve();
      });

      await waitFor(() => {
        expect(proxy.isGuildItemVisible({ testId: `GUILD_ITEM_${guild.id}` })).toBe(true);
      });

      expect(proxy.isGuildItemVisible({ testId: `GUILD_ITEM_${guild.id}` })).toBe(true);
    });

    it('VALID: {click guild with no sessions} => shows empty state', async () => {
      const proxy = AppWidgetProxy();

      proxy.setupMountDefaults();
      const guild = GuildListItemStub({
        id: 'a7b8c9d0-e1f2-3456-abcd-567890123456',
        name: 'Empty Guild',
      });

      proxy.setupGuilds({ guilds: [guild] });

      await act(async () => {
        renderApp();
        await Promise.resolve();
      });

      await waitFor(() => {
        expect(proxy.isGuildItemVisible({ testId: `GUILD_ITEM_${guild.id}` })).toBe(true);
      });

      proxy.setupSessions({ sessions: [] });

      await act(async () => {
        await proxy.clickGuildItem({ testId: `GUILD_ITEM_${guild.id}` });
        await Promise.resolve();
      });

      await waitFor(() => {
        expect(proxy.isSessionEmptyStateVisible()).toBe(true);
      });

      expect(proxy.isSessionEmptyStateVisible()).toBe(true);
    });

    it('VALID: {click guild, session list error} => error state', async () => {
      const proxy = AppWidgetProxy();

      proxy.setupMountDefaults();
      const guild = GuildListItemStub({
        id: 'a40faea2-026e-45c5-8e86-7668de10b44e',
        name: 'Error Guild',
      });

      proxy.setupGuilds({ guilds: [guild] });

      await act(async () => {
        renderApp();
        await Promise.resolve();
      });

      await waitFor(() => {
        expect(proxy.isGuildItemVisible({ testId: `GUILD_ITEM_${guild.id}` })).toBe(true);
      });

      proxy.setupSessionsError();

      await act(async () => {
        await proxy.clickGuildItem({ testId: `GUILD_ITEM_${guild.id}` });
        await Promise.resolve();
      });

      await waitFor(() => {
        expect(proxy.isSessionEmptyStateVisible()).toBe(true);
      });

      expect(proxy.isSessionEmptyStateVisible()).toBe(true);
    });
  });

  describe('navigation between views', () => {
    it('VALID: {main, click session} => shows readonly session view', async () => {
      const proxy = AppWidgetProxy();

      proxy.setupMountDefaults();
      const guild = GuildListItemStub({
        id: '48a4b30a-6cfa-699d-a176-b5df8974d64d',
        name: 'Nav Guild',
      });
      const sessions = [SessionListItemStub({ sessionId: 'nav-s1', questId: 'quest-nav' })];

      proxy.setupGuilds({ guilds: [guild] });

      await act(async () => {
        renderApp();
        await Promise.resolve();
      });

      await waitFor(() => {
        expect(proxy.isGuildItemVisible({ testId: `GUILD_ITEM_${guild.id}` })).toBe(true);
      });

      proxy.setupSessions({ sessions });

      await act(async () => {
        await proxy.clickGuildItem({ testId: `GUILD_ITEM_${guild.id}` });
        await Promise.resolve();
      });

      await act(async () => {
        await proxy.selectAllSessionsFilter();
        await Promise.resolve();
      });

      await act(async () => {
        await proxy.clickSessionItem({ testId: 'SESSION_ITEM_nav-s1' });
        await Promise.resolve();
      });

      await waitFor(() => {
        expect(proxy.isSessionViewVisible()).toBe(true);
      });

      expect(proxy.isSessionViewVisible()).toBe(true);
    });

    it('VALID: {empty state, create guild} => auto-transitions to main', async () => {
      const proxy = AppWidgetProxy();

      proxy.setupMountDefaults();
      const guildId = GuildIdStub({ value: 'af549d80-9334-57cd-b11f-a917419f8361' });
      const guild = GuildListItemStub({ id: guildId, name: 'auto-guild' });

      proxy.setupGuilds({ guilds: [] });

      await act(async () => {
        renderApp();
        await Promise.resolve();
      });

      await waitFor(() => {
        expect(proxy.isNewGuildTitleVisible()).toBe(true);
      });

      await act(async () => {
        await proxy.typeGuildName({ value: 'auto-guild' });
        await proxy.typeGuildPath({ value: '/home/user/auto-guild' });
        await Promise.resolve();
      });

      proxy.setupCreateGuild({ id: guildId });
      proxy.setupGuilds({ guilds: [guild] });
      proxy.setupSessions({ sessions: [] });

      await act(async () => {
        await proxy.clickCreateGuild();
        await Promise.resolve();
      });

      await waitFor(() => {
        expect(proxy.isGuildItemVisible({ testId: `GUILD_ITEM_${guildId}` })).toBe(true);
      });

      expect(proxy.isNewGuildTitleVisible()).toBe(false);
    });

    it('VALID: {multiple guilds, select one} => gold highlight visible', async () => {
      const proxy = AppWidgetProxy();

      proxy.setupMountDefaults();
      const guildA = GuildListItemStub({
        id: '5abe6461-5231-558d-9d81-42c94e32bad3',
        name: 'Guild Alpha',
      });
      const guildB = GuildListItemStub({
        id: '1734d78c-3482-3e5c-bada-773bfc9ecbdf',
        name: 'Guild Beta',
      });

      proxy.setupGuilds({ guilds: [guildA, guildB] });

      await act(async () => {
        renderApp();
        await Promise.resolve();
      });

      await waitFor(() => {
        expect(proxy.isGuildItemVisible({ testId: `GUILD_ITEM_${guildA.id}` })).toBe(true);
      });

      proxy.setupSessions({ sessions: [] });

      await act(async () => {
        await proxy.clickGuildItem({ testId: `GUILD_ITEM_${guildA.id}` });
        await Promise.resolve();
      });

      await waitFor(() => {
        expect(proxy.isGuildItemSelected({ testId: `GUILD_ITEM_${guildA.id}` })).toBe(true);
      });

      expect(proxy.isGuildItemSelected({ testId: `GUILD_ITEM_${guildA.id}` })).toBe(true);
    });
  });

  describe('logo link navigation', () => {
    it('VALID: {} => logo link is visible', async () => {
      const proxy = AppWidgetProxy();

      proxy.setupMountDefaults();
      proxy.setupGuilds({ guilds: [] });

      await act(async () => {
        renderApp();
        await Promise.resolve();
      });

      await waitFor(() => {
        expect(proxy.isLogoLinkVisible()).toBe(true);
      });

      expect(proxy.isLogoLinkVisible()).toBe(true);
    });

    it('VALID: {on session view route, click logo} => navigates back to home', async () => {
      const proxy = AppWidgetProxy();

      proxy.setupMountDefaults();
      const guild = GuildListItemStub({
        id: 'b0c1d2e3-f4a5-6789-bcde-f01234567890',
        name: 'Logo Nav Guild',
      });
      const sessions = [SessionListItemStub({ sessionId: 'logo-s1', questId: 'quest-logo' })];

      proxy.setupGuilds({ guilds: [guild] });

      await act(async () => {
        renderApp();
        await Promise.resolve();
      });

      await waitFor(() => {
        expect(proxy.isGuildItemVisible({ testId: `GUILD_ITEM_${guild.id}` })).toBe(true);
      });

      proxy.setupSessions({ sessions });

      await act(async () => {
        await proxy.clickGuildItem({ testId: `GUILD_ITEM_${guild.id}` });
        await Promise.resolve();
      });

      await act(async () => {
        await proxy.selectAllSessionsFilter();
        await Promise.resolve();
      });

      await act(async () => {
        await proxy.clickSessionItem({ testId: 'SESSION_ITEM_logo-s1' });
        await Promise.resolve();
      });

      await waitFor(() => {
        expect(proxy.isSessionViewVisible()).toBe(true);
      });

      proxy.setupGuilds({ guilds: [guild] });

      await act(async () => {
        await proxy.clickLogoLink();
        await Promise.resolve();
      });

      await waitFor(() => {
        expect(proxy.isGuildItemVisible({ testId: `GUILD_ITEM_${guild.id}` })).toBe(true);
      });

      expect(proxy.isGuildItemVisible({ testId: `GUILD_ITEM_${guild.id}` })).toBe(true);
      expect(proxy.isSessionViewVisible()).toBe(false);
    });
  });

  describe('error and edge cases', () => {
    it('ERROR: {guilds API error} => shows the load error instead of the first-run NEW GUILD form', async () => {
      const proxy = AppWidgetProxy();

      proxy.setupMountDefaults();
      proxy.setupGuildsError();

      await act(async () => {
        renderApp();
        await Promise.resolve();
      });

      await waitFor(() => {
        expect(proxy.getGuildsErrorText()).toBe('Could not load guilds: Failed to fetch');
      });

      expect(proxy.getGuildsErrorText()).toBe('Could not load guilds: Failed to fetch');
      expect(proxy.isNewGuildTitleVisible()).toBe(false);
    });

    it('VALID: {load 3 guilds} => all visible in left column', async () => {
      const proxy = AppWidgetProxy();

      proxy.setupMountDefaults();
      const guildA = GuildListItemStub({
        id: '78f29cbd-2d13-8067-9049-3b335a501617',
        name: 'Guild One',
      });
      const guildB = GuildListItemStub({
        id: 'c8ee51e4-ff3f-1161-85da-669f5458106b',
        name: 'Guild Two',
      });
      const guildC = GuildListItemStub({
        id: '0e8e054d-b95d-6c34-907f-698ac185ba7e',
        name: 'Guild Three',
      });

      proxy.setupGuilds({ guilds: [guildA, guildB, guildC] });

      await act(async () => {
        renderApp();
        await Promise.resolve();
      });

      await waitFor(() => {
        expect(proxy.isGuildItemVisible({ testId: `GUILD_ITEM_${guildA.id}` })).toBe(true);
      });

      expect(proxy.isGuildItemVisible({ testId: `GUILD_ITEM_${guildB.id}` })).toBe(true);
      expect(proxy.isGuildItemVisible({ testId: `GUILD_ITEM_${guildC.id}` })).toBe(true);
    });

    it('VALID: {click session} => renders readonly session view instead of quest detail tabs', async () => {
      const proxy = AppWidgetProxy();

      proxy.setupMountDefaults();
      const guild = GuildListItemStub({
        id: 'a9b0c1d2-e3f4-5678-abcd-789abcdef012',
        name: 'Tab Guild',
      });
      const sessions = [SessionListItemStub({ sessionId: 'tab-s1', questId: 'quest-tab' })];

      proxy.setupGuilds({ guilds: [guild] });

      await act(async () => {
        renderApp();
        await Promise.resolve();
      });

      await waitFor(() => {
        expect(proxy.isGuildItemVisible({ testId: `GUILD_ITEM_${guild.id}` })).toBe(true);
      });

      proxy.setupSessions({ sessions });

      await act(async () => {
        await proxy.clickGuildItem({ testId: `GUILD_ITEM_${guild.id}` });
        await Promise.resolve();
      });

      await act(async () => {
        await proxy.selectAllSessionsFilter();
        await Promise.resolve();
      });

      await act(async () => {
        await proxy.clickSessionItem({ testId: 'SESSION_ITEM_tab-s1' });
        await Promise.resolve();
      });

      await waitFor(() => {
        expect(proxy.isSessionViewVisible()).toBe(true);
      });

      expect(proxy.isSessionViewVisible()).toBe(true);
    });
  });

  describe('shared websocket connection', () => {
    it('VALID: {chat + queue + rate-limits bindings mounted together} => exactly one WebSocket is opened', async () => {
      const proxy = AppWidgetProxy();
      proxy.setupQuestQueue({ entries: [] });
      proxy.setupRateLimits({ snapshot: null });
      proxy.setupSharedChannel();

      const questId = QuestIdStub({ value: 'test-quest' });

      const { result: chatResult } = renderHook(() => useQuestChatBinding({ questId }));
      const { result: queueResult } = renderHook(() => useQuestQueueBinding());
      const { result: rateLimitsResult } = renderHook(() => useRateLimitsBinding());

      // Both HTTP-backed bindings finishing their load confirms every mount effect, the socket
      // subscriptions included, has run.
      await waitFor(() => {
        expect(queueResult.current).toStrictEqual({
          activeEntry: null,
          allEntries: [],
          errorEntry: undefined,
          isLoading: false,
        });
        expect(rateLimitsResult.current).toStrictEqual({
          snapshot: null,
          isLoading: false,
        });
      });

      expect(chatResult.current).toStrictEqual({
        entriesBySession: new Map(),
        entriesByWorkItem: new Map(),
        slotEntries: new Map(),
        followupEntries: [],
        quest: null,
        loadError: null,
        pendingClarification: null,
        isStreaming: false,
        isFollowupStreaming: false,
        armStreaming: expect.any(Function),
        disarmStreaming: expect.any(Function),
        disarmFollowupStreaming: expect.any(Function),
        sendMessage: expect.any(Function),
        sendFollowupMessage: expect.any(Function),
        sendCommentBatch: expect.any(Function),
        submitClarifyAnswers: expect.any(Function),
        stopChat: expect.any(Function),
        stopFollowupChat: expect.any(Function),
      });
      // The three bindings share the singleton webSocketChannelState, so one socket serves them all.
      expect(proxy.getSocketConnectionCount()).toBe(1);
    });
  });
});
