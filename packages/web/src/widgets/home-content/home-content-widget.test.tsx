/**
 * PURPOSE: Tests for HomeContentWidget - guild selection and session list rendering
 */

import { act, screen, waitFor } from '#gateway/npm/testing-library__react';
import { readItem, writeItem } from '#gateway/browser/localStorage';
import { StorageDisabledErrorStub } from '#gateway/browser/localStorage/read-item/storage-disabled-error.stub';
import { MemoryRouter, Route, Routes, useLocation } from '#gateway/npm/react-router-dom';
import { GuildIdStub } from '@dungeonmaster/shared/contracts/guild-id/guild-id.stub';
import { GuildListItemStub } from '@dungeonmaster/shared/contracts/guild-list-item/guild-list-item.stub';
import { QuestIdStub } from '@dungeonmaster/shared/contracts/quest-id/quest-id.stub';
import { QuestListItemStub } from '@dungeonmaster/shared/contracts/quest-list-item/quest-list-item.stub';
import { SessionIdStub } from '@dungeonmaster/shared/contracts/session-id/session-id.stub';
import { SessionListItemStub } from '@dungeonmaster/shared/contracts/session-list-item/session-list-item.stub';
import { SkippedQuestFileStub } from '@dungeonmaster/shared/contracts/skipped-quest-file/skipped-quest-file.stub';

import { mantineRenderMiddleware } from '@dungeonmaster/testing/middleware/mantine-render';
import { HomeContentWidget } from './home-content-widget';
import { HomeContentWidgetProxy } from './home-content-widget.proxy';

const GUILD_STORAGE_KEY = 'dungeonmaster-last-guild';

const LocationProbe = (): React.JSX.Element => {
  const location = useLocation();
  return <div data-testid="LOCATION">{location.pathname}</div>;
};

describe('HomeContentWidget', () => {
  describe('empty state', () => {
    it('VALID: {no guilds} => shows NEW GUILD form', async () => {
      const proxy = HomeContentWidgetProxy();

      proxy.setupDirectoryBrowse({ entries: [] });

      proxy.setupGuilds({ guilds: [] });

      await act(async () => {
        mantineRenderMiddleware({
          ui: (
            <MemoryRouter>
              <HomeContentWidget />
            </MemoryRouter>
          ),
        });
        await Promise.resolve();
      });

      await waitFor(() => {
        expect(proxy.isNewGuildTitleVisible()).toBe(true);
      });

      expect(proxy.isNewGuildTitleVisible()).toBe(true);
    });

    it('ERROR: {guild list request fails} => shows the load error and the guild list, not the first-run NEW GUILD form', async () => {
      const proxy = HomeContentWidgetProxy();

      proxy.setupDirectoryBrowse({ entries: [] });
      proxy.setupGuildsError();

      await act(async () => {
        mantineRenderMiddleware({
          ui: (
            <MemoryRouter>
              <HomeContentWidget />
            </MemoryRouter>
          ),
        });
        await Promise.resolve();
      });

      await waitFor(() => {
        expect(proxy.getGuildsErrorText()).toBe('Could not load guilds: Failed to fetch');
      });

      expect(proxy.getGuildsErrorText()).toBe('Could not load guilds: Failed to fetch');
      expect(proxy.isNewGuildTitleVisible()).toBe(false);
      expect(screen.getByTestId('GUILD_ADD_BUTTON').textContent).toBe('+ ');
    });
  });

  describe('guild list view', () => {
    it('VALID: {guilds loaded} => shows guild items', async () => {
      const proxy = HomeContentWidgetProxy();

      proxy.setupDirectoryBrowse({ entries: [] });
      const guild = GuildListItemStub({ name: 'Guild One' });
      const guilds = [guild];

      proxy.setupGuilds({ guilds });

      await act(async () => {
        mantineRenderMiddleware({
          ui: (
            <MemoryRouter>
              <HomeContentWidget />
            </MemoryRouter>
          ),
        });
        await Promise.resolve();
      });

      await waitFor(() => {
        expect(proxy.isGuildItemVisible({ testId: `GUILD_ITEM_${guild.id}` })).toBe(true);
      });

      expect(proxy.isGuildItemVisible({ testId: `GUILD_ITEM_${guild.id}` })).toBe(true);
    });

    it('VALID: {no guild selected} => shows select a guild message', async () => {
      const proxy = HomeContentWidgetProxy();

      proxy.setupDirectoryBrowse({ entries: [] });
      const guilds = [GuildListItemStub({ name: 'My Guild' })];

      proxy.setupGuilds({ guilds });

      await act(async () => {
        mantineRenderMiddleware({
          ui: (
            <MemoryRouter>
              <HomeContentWidget />
            </MemoryRouter>
          ),
        });
        await Promise.resolve();
      });

      await waitFor(() => {
        expect(proxy.isSelectGuildMessageVisible()).toBe(true);
      });

      expect(proxy.isSelectGuildMessageVisible()).toBe(true);
    });
  });

  describe('guild creation', () => {
    it('VALID: {empty state, type name, CREATE} => guild appears', async () => {
      const proxy = HomeContentWidgetProxy();

      proxy.setupDirectoryBrowse({ entries: [] });
      proxy.setupQuests({ quests: [] });
      const guildId = GuildIdStub({ value: 'a1b2c3d4-e5f6-7890-abcd-ef1234567890' });
      const createdGuild = GuildListItemStub({
        id: guildId,
        name: 'new-guild',
      });

      proxy.setupGuilds({ guilds: [] });

      await act(async () => {
        mantineRenderMiddleware({
          ui: (
            <MemoryRouter>
              <HomeContentWidget />
            </MemoryRouter>
          ),
        });
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
  });

  describe('localStorage guild persistence', () => {
    it('VALID: {click guild} => saves guild ID to localStorage', async () => {
      const proxy = HomeContentWidgetProxy();

      proxy.setupDirectoryBrowse({ entries: [] });
      proxy.setupQuests({ quests: [] });
      proxy.clearStorage();
      const guild = GuildListItemStub({ name: 'Persist Guild' });

      proxy.setupGuilds({ guilds: [guild] });

      await act(async () => {
        mantineRenderMiddleware({
          ui: (
            <MemoryRouter>
              <HomeContentWidget />
            </MemoryRouter>
          ),
        });
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
        expect(readItem({ key: GUILD_STORAGE_KEY })).toBe(guild.id);
      });

      expect(readItem({ key: GUILD_STORAGE_KEY })).toBe(guild.id);
    });

    it('VALID: {stored guild in localStorage, guild exists} => auto-selects guild on mount', async () => {
      const proxy = HomeContentWidgetProxy();

      proxy.setupDirectoryBrowse({ entries: [] });
      proxy.setupQuests({ quests: [] });
      proxy.clearStorage();
      const guild = GuildListItemStub({ name: 'Stored Guild' });

      writeItem({ key: GUILD_STORAGE_KEY, value: guild.id });

      proxy.setupGuilds({ guilds: [guild] });
      proxy.setupSessions({ sessions: [] });

      await act(async () => {
        mantineRenderMiddleware({
          ui: (
            <MemoryRouter>
              <HomeContentWidget />
            </MemoryRouter>
          ),
        });
        await Promise.resolve();
      });

      await waitFor(() => {
        expect(proxy.isGuildItemSelected({ testId: `GUILD_ITEM_${guild.id}` })).toBe(true);
      });

      expect(proxy.isGuildItemSelected({ testId: `GUILD_ITEM_${guild.id}` })).toBe(true);
    });

    it('VALID: {stored guild in localStorage, guild not in list} => clears localStorage', async () => {
      const proxy = HomeContentWidgetProxy();

      proxy.setupDirectoryBrowse({ entries: [] });
      proxy.setupQuests({ quests: [] });
      proxy.clearStorage();
      const staleGuildId = GuildIdStub({ value: 'a99ef0d8-6ae0-1972-9617-694d449a8242' });
      const realGuild = GuildListItemStub({ name: 'Real Guild' });

      writeItem({ key: GUILD_STORAGE_KEY, value: staleGuildId });

      proxy.setupGuilds({ guilds: [realGuild] });
      proxy.setupSessions({ sessions: [] });

      await act(async () => {
        mantineRenderMiddleware({
          ui: (
            <MemoryRouter>
              <HomeContentWidget />
            </MemoryRouter>
          ),
        });
        await Promise.resolve();
      });

      await waitFor(() => {
        expect(readItem({ key: GUILD_STORAGE_KEY })).toBe(null);
      });

      expect(readItem({ key: GUILD_STORAGE_KEY })).toBe(null);
      expect(proxy.isSelectGuildMessageVisible()).toBe(true);
    });

    it('ERROR: {storage refuses saving the clicked guild} => logs the refusal and stores nothing', async () => {
      const proxy = HomeContentWidgetProxy();

      proxy.setupDirectoryBrowse({ entries: [] });
      proxy.setupQuests({ quests: [] });
      proxy.clearStorage();
      proxy.storageWriteFails({ key: GUILD_STORAGE_KEY });
      const guild = GuildListItemStub({ name: 'Refused Guild' });

      proxy.setupGuilds({ guilds: [guild] });

      await act(async () => {
        mantineRenderMiddleware({
          ui: (
            <MemoryRouter>
              <HomeContentWidget />
            </MemoryRouter>
          ),
        });
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
        expect(
          proxy.getLoggedErrorsFor({
            message: '[home-content] failed to persist the selected guild',
          }),
        ).toStrictEqual([
          ['[home-content] failed to persist the selected guild', StorageDisabledErrorStub()],
        ]);
      });

      expect(readItem({ key: GUILD_STORAGE_KEY })).toBe(null);
    });

    it('ERROR: {no guild selected, storage refuses clearing the saved guild} => logs the refusal', async () => {
      const proxy = HomeContentWidgetProxy();

      proxy.setupDirectoryBrowse({ entries: [] });
      proxy.clearStorage();
      proxy.storageRemoveFails({ key: GUILD_STORAGE_KEY });
      proxy.setupGuilds({ guilds: [GuildListItemStub({ name: 'Some Guild' })] });

      await act(async () => {
        mantineRenderMiddleware({
          ui: (
            <MemoryRouter>
              <HomeContentWidget />
            </MemoryRouter>
          ),
        });
        await Promise.resolve();
      });

      await waitFor(() => {
        expect(proxy.isSelectGuildMessageVisible()).toBe(true);
      });

      expect(
        proxy.getLoggedErrorsFor({
          message: '[home-content] failed to persist the selected guild',
        }),
      ).toStrictEqual([
        ['[home-content] failed to persist the selected guild', StorageDisabledErrorStub()],
      ]);
    });

    it('EMPTY: {no stored guild} => shows select a guild message', async () => {
      const proxy = HomeContentWidgetProxy();

      proxy.setupDirectoryBrowse({ entries: [] });
      proxy.clearStorage();
      const guilds = [GuildListItemStub({ name: 'Some Guild' })];

      proxy.setupGuilds({ guilds });

      await act(async () => {
        mantineRenderMiddleware({
          ui: (
            <MemoryRouter>
              <HomeContentWidget />
            </MemoryRouter>
          ),
        });
        await Promise.resolve();
      });

      await waitFor(() => {
        expect(proxy.isSelectGuildMessageVisible()).toBe(true);
      });

      expect(proxy.isSelectGuildMessageVisible()).toBe(true);
      expect(readItem({ key: GUILD_STORAGE_KEY })).toBe(null);
    });
  });

  describe('navigation', () => {
    it('VALID: {click queue link} => navigates to /queue', async () => {
      const proxy = HomeContentWidgetProxy();

      proxy.setupDirectoryBrowse({ entries: [] });
      proxy.clearStorage();
      const guild = GuildListItemStub({ name: 'Queue Guild' });

      proxy.setupGuilds({ guilds: [guild] });

      await act(async () => {
        mantineRenderMiddleware({
          ui: (
            <MemoryRouter initialEntries={['/']}>
              <Routes>
                <Route
                  path="/"
                  element={
                    <>
                      <HomeContentWidget />
                      <LocationProbe />
                    </>
                  }
                />
                <Route path="/queue" element={<LocationProbe />} />
              </Routes>
            </MemoryRouter>
          ),
        });
        await Promise.resolve();
      });

      await waitFor(() => {
        expect(proxy.isQueueLinkVisible()).toBe(true);
      });

      await act(async () => {
        await proxy.clickQueueLink();
        await Promise.resolve();
      });

      await waitFor(() => {
        const el = screen.getByTestId('LOCATION');

        expect(el.textContent).toBe('/queue');
      });

      const finalEl = screen.getByTestId('LOCATION');

      expect(finalEl.textContent).toBe('/queue');
    });

    it('VALID: {click session add button} => navigates to /:guildSlug/quest (no session)', async () => {
      const proxy = HomeContentWidgetProxy();

      proxy.setupDirectoryBrowse({ entries: [] });
      proxy.setupQuests({ quests: [] });
      proxy.clearStorage();
      const guild = GuildListItemStub({
        id: GuildIdStub({ value: 'b1b2c3d4-e5f6-7890-abcd-ef1234567890' }),
        name: 'Nav Guild',
        urlSlug: 'nav-guild',
      });

      proxy.setupGuilds({ guilds: [guild] });
      proxy.setupSessions({ sessions: [] });

      await act(async () => {
        mantineRenderMiddleware({
          ui: (
            <MemoryRouter initialEntries={['/']}>
              <Routes>
                <Route
                  path="/"
                  element={
                    <>
                      <HomeContentWidget />
                      <LocationProbe />
                    </>
                  }
                />
                <Route path="/:guildSlug/quest" element={<LocationProbe />} />
                <Route path="/:guildSlug/session/:sessionId" element={<LocationProbe />} />
              </Routes>
            </MemoryRouter>
          ),
        });
        await Promise.resolve();
      });

      await waitFor(() => {
        expect(proxy.isGuildItemVisible({ testId: `GUILD_ITEM_${guild.id}` })).toBe(true);
      });

      await act(async () => {
        await proxy.clickGuildItem({ testId: `GUILD_ITEM_${guild.id}` });
        await Promise.resolve();
      });

      await act(async () => {
        await proxy.clickAddSession();
        await Promise.resolve();
      });

      await waitFor(() => {
        const el = screen.getByTestId('LOCATION');

        expect(el.textContent).toBe('/nav-guild/quest');
      });

      const finalEl = screen.getByTestId('LOCATION');

      expect(finalEl.textContent).toBe('/nav-guild/quest');
    });

    it('VALID: {click quest-linked session row} => navigates to /:guildSlug/quest/:questId', async () => {
      const proxy = HomeContentWidgetProxy();

      proxy.setupDirectoryBrowse({ entries: [] });
      proxy.setupQuests({ quests: [] });
      proxy.clearStorage();
      const guild = GuildListItemStub({
        id: GuildIdStub({ value: 'c1b2c3d4-e5f6-7890-abcd-ef1234567890' }),
        name: 'Session Guild',
        urlSlug: 'session-guild',
      });
      const sessionId = SessionIdStub({ value: 'd1b2c3d4-e5f6-7890-abcd-ef1234567890' });
      const questId = QuestIdStub({ value: 'e1b2c3d4-e5f6-7890-abcd-ef1234567890' });
      const session = SessionListItemStub({
        sessionId,
        questId,
        questTitle: 'A Quest',
      });

      proxy.setupGuilds({ guilds: [guild] });
      proxy.setupSessions({ sessions: [session] });

      await act(async () => {
        mantineRenderMiddleware({
          ui: (
            <MemoryRouter initialEntries={['/']}>
              <Routes>
                <Route
                  path="/"
                  element={
                    <>
                      <HomeContentWidget />
                      <LocationProbe />
                    </>
                  }
                />
                <Route path="/:guildSlug/quest" element={<LocationProbe />} />
                <Route path="/:guildSlug/quest/:questId" element={<LocationProbe />} />
                <Route path="/:guildSlug/session/:sessionId" element={<LocationProbe />} />
              </Routes>
            </MemoryRouter>
          ),
        });
        await Promise.resolve();
      });

      await waitFor(() => {
        expect(proxy.isGuildItemVisible({ testId: `GUILD_ITEM_${guild.id}` })).toBe(true);
      });

      await act(async () => {
        await proxy.clickGuildItem({ testId: `GUILD_ITEM_${guild.id}` });
        await Promise.resolve();
      });

      // Default filter is "Quests Only" which renders quest rows, not session
      // rows. To click the underlying session row, switch to "All" first.
      await act(async () => {
        await proxy.selectAllSessionsFilter();
        await Promise.resolve();
      });

      await waitFor(() => {
        const sessionEl = screen.getByTestId(`SESSION_ITEM_${sessionId}`);

        expect(sessionEl.tagName).toBe('BUTTON');
      });

      await act(async () => {
        await proxy.clickSessionItem({ testId: `SESSION_ITEM_${sessionId}` });
        await Promise.resolve();
      });

      await waitFor(() => {
        const el = screen.getByTestId('LOCATION');

        expect(el.textContent).toBe(`/session-guild/quest/${questId}`);
      });

      const finalEl = screen.getByTestId('LOCATION');

      expect(finalEl.textContent).toBe(`/session-guild/quest/${questId}`);
    });

    it('VALID: {click orphan session row (no quest)} => navigates to /:guildSlug/session/:sessionId', async () => {
      const proxy = HomeContentWidgetProxy();

      proxy.setupDirectoryBrowse({ entries: [] });
      proxy.setupQuests({ quests: [] });
      proxy.clearStorage();
      const guild = GuildListItemStub({
        id: GuildIdStub({ value: 'c1b2c3d4-e5f6-7890-abcd-ef1234567891' }),
        name: 'Orphan Session Guild',
        urlSlug: 'orphan-session-guild',
      });
      const sessionId = SessionIdStub({ value: 'd1b2c3d4-e5f6-7890-abcd-ef1234567891' });
      const session = SessionListItemStub({ sessionId });

      proxy.setupGuilds({ guilds: [guild] });
      proxy.setupSessions({ sessions: [session] });

      await act(async () => {
        mantineRenderMiddleware({
          ui: (
            <MemoryRouter initialEntries={['/']}>
              <Routes>
                <Route
                  path="/"
                  element={
                    <>
                      <HomeContentWidget />
                      <LocationProbe />
                    </>
                  }
                />
                <Route path="/:guildSlug/quest" element={<LocationProbe />} />
                <Route path="/:guildSlug/quest/:questId" element={<LocationProbe />} />
                <Route path="/:guildSlug/session/:sessionId" element={<LocationProbe />} />
              </Routes>
            </MemoryRouter>
          ),
        });
        await Promise.resolve();
      });

      await waitFor(() => {
        expect(proxy.isGuildItemVisible({ testId: `GUILD_ITEM_${guild.id}` })).toBe(true);
      });

      await act(async () => {
        await proxy.clickGuildItem({ testId: `GUILD_ITEM_${guild.id}` });
        await Promise.resolve();
      });

      // Orphan filter — toggle to "All" so the no-quest row is visible
      await act(async () => {
        await proxy.selectAllSessionsFilter();
        await Promise.resolve();
      });

      await waitFor(() => {
        const sessionEl = screen.getByTestId(`SESSION_ITEM_${sessionId}`);

        expect(sessionEl.tagName).toBe('BUTTON');
      });

      await act(async () => {
        await proxy.clickSessionItem({ testId: `SESSION_ITEM_${sessionId}` });
        await Promise.resolve();
      });

      await waitFor(() => {
        const el = screen.getByTestId('LOCATION');

        expect(el.textContent).toBe(`/orphan-session-guild/session/${sessionId}`);
      });

      const finalEl = screen.getByTestId('LOCATION');

      expect(finalEl.textContent).toBe(`/orphan-session-guild/session/${sessionId}`);
    });
  });

  describe('error logging in catch handlers', () => {
    it('ERROR: {guildCreateBroker rejects} => logs error to console.error', async () => {
      const proxy = HomeContentWidgetProxy();

      proxy.setupDirectoryBrowse({ entries: [] });
      proxy.setupQuests({ quests: [] });

      proxy.setupGuilds({ guilds: [] });
      proxy.setupSessions({ sessions: [] });

      await act(async () => {
        mantineRenderMiddleware({
          ui: (
            <MemoryRouter>
              <HomeContentWidget />
            </MemoryRouter>
          ),
        });
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
        const [loggedError] = proxy
          .getLoggedErrorsFor({ message: '[home-content] guild create failed' })
          .map((call) => call[1]);

        expect(loggedError).toBeInstanceOf(Error);
        expect(
          proxy.getLoggedErrorsFor({ message: '[home-content] guild create failed' }),
        ).toStrictEqual([['[home-content] guild create failed', loggedError]]);
      });

      const [loggedError] = proxy
        .getLoggedErrorsFor({ message: '[home-content] guild create failed' })
        .map((call) => call[1]);

      expect(loggedError).toBeInstanceOf(Error);
      expect(
        proxy.getLoggedErrorsFor({ message: '[home-content] guild create failed' }),
      ).toStrictEqual([['[home-content] guild create failed', loggedError]]);
    });
  });

  describe('quest delete from root page', () => {
    it('VALID: {click skull, Banish, delete resolves} => broker called once with questId+guildId, row removed, popover hidden', async () => {
      const proxy = HomeContentWidgetProxy();

      proxy.setupDirectoryBrowse({ entries: [] });
      proxy.clearStorage();
      const guildId = GuildIdStub({ value: 'f1b2c3d4-e5f6-7890-abcd-ef1234567890' });
      const guild = GuildListItemStub({ id: guildId, name: 'Delete Guild' });
      const questId = QuestIdStub({ value: 'delete-me-quest' });
      const quest = QuestListItemStub({
        id: questId,
        title: 'Delete Me',
        status: 'complete',
      });
      writeItem({ key: GUILD_STORAGE_KEY, value: guildId });

      proxy.setupGuilds({ guilds: [guild] });
      proxy.setupSessions({ sessions: [] });
      proxy.setupQuests({ quests: [quest] });
      proxy.setupDeleteQuest();

      await act(async () => {
        mantineRenderMiddleware({
          ui: (
            <MemoryRouter>
              <HomeContentWidget />
            </MemoryRouter>
          ),
        });
        await Promise.resolve();
      });

      await waitFor(() => {
        expect(screen.getByTestId(`QUEST_DELETE_${questId}`).tagName).toBe('BUTTON');
      });

      await act(async () => {
        await proxy.clickDeleteButton({ testId: `QUEST_DELETE_${questId}` });
        await Promise.resolve();
      });

      proxy.setupQuests({ quests: [] });

      await act(async () => {
        await proxy.clickBanish();
        await Promise.resolve();
      });

      await waitFor(() => {
        expect(screen.queryByTestId(`QUEST_ITEM_${questId}`)).toBe(null);
      });

      expect(proxy.getDeleteBrokerCalls()).toStrictEqual([[{ questId, guildId }]]);
      expect(screen.queryByTestId(`QUEST_ITEM_${questId}`)).toBe(null);
      expect(proxy.isPopoverVisible({ testId: `QUEST_DELETE_POPOVER_${questId}` })).toBe(false);
    });

    it("ERROR: {delete answers 409 'Quest is currently running'} => red toast with the request failure message, row remains, popover hidden", async () => {
      const proxy = HomeContentWidgetProxy();

      proxy.setupDirectoryBrowse({ entries: [] });
      proxy.clearStorage();
      const guildId = GuildIdStub({ value: 'a2b2c3d4-e5f6-7890-abcd-ef1234567890' });
      const guild = GuildListItemStub({ id: guildId, name: 'Err Guild' });
      const questId = QuestIdStub({ value: 'running-quest' });
      const quest = QuestListItemStub({
        id: questId,
        title: 'Running Quest',
        status: 'complete',
      });
      writeItem({ key: GUILD_STORAGE_KEY, value: guildId });

      proxy.setupGuilds({ guilds: [guild] });
      proxy.setupSessions({ sessions: [] });
      proxy.setupQuests({ quests: [quest] });
      proxy.setupDeleteQuestNotOk({ status: 409, bodyText: 'Quest is currently running' });

      await act(async () => {
        mantineRenderMiddleware({
          ui: (
            <MemoryRouter>
              <HomeContentWidget />
            </MemoryRouter>
          ),
        });
        await Promise.resolve();
      });

      await waitFor(() => {
        expect(screen.getByTestId(`QUEST_DELETE_${questId}`).tagName).toBe('BUTTON');
      });

      await act(async () => {
        await proxy.clickDeleteButton({ testId: `QUEST_DELETE_${questId}` });
        await Promise.resolve();
      });

      await act(async () => {
        await proxy.clickBanish();
        await Promise.resolve();
      });

      await waitFor(() => {
        expect(proxy.getShownToast()).toStrictEqual({
          message: `DELETE /api/quests/${questId}?guildId=${guildId} failed with status 409: Quest is currently running`,
          color: 'red',
        });
      });

      expect(proxy.getShownToast()).toStrictEqual({
        message: `DELETE /api/quests/${questId}?guildId=${guildId} failed with status 409: Quest is currently running`,
        color: 'red',
      });
      expect(screen.getByTestId(`QUEST_ITEM_${questId}`).tagName).toBe('DIV');
      expect(proxy.isPopoverVisible({ testId: `QUEST_DELETE_POPOVER_${questId}` })).toBe(false);
    });
  });

  describe('unreadable quest files', () => {
    it('VALID: {list reports one unreadable quest file} => raises a red toast and renders the unreadable row', async () => {
      const proxy = HomeContentWidgetProxy();

      proxy.setupDirectoryBrowse({ entries: [] });
      const guildId = GuildIdStub({ value: 'c3c3c3d4-e5f6-7890-abcd-ef1234567890' });
      const guild = GuildListItemStub({ id: guildId, name: 'Unreadable Guild' });
      writeItem({ key: GUILD_STORAGE_KEY, value: guildId });

      proxy.setupGuilds({ guilds: [guild] });
      proxy.setupSessions({ sessions: [] });
      proxy.setupQuestsWithSkips({
        quests: [QuestListItemStub({ id: QuestIdStub({ value: 'readable-quest' }) })],
        skipped: [
          SkippedQuestFileStub({
            questFolder: '4226b8d1',
            reason: "workItems.1.role: received 'pathseeker'",
          }),
        ],
      });

      await act(async () => {
        mantineRenderMiddleware({
          ui: (
            <MemoryRouter>
              <HomeContentWidget />
            </MemoryRouter>
          ),
        });
        await Promise.resolve();
      });

      await waitFor(() => {
        expect(proxy.getUnreadableQuestRowTexts()).toStrictEqual([
          "4226b8d1/quest.jsonUNREADABLEworkItems.1.role: received 'pathseeker'",
        ]);
      });

      expect(proxy.getShownToast()).toStrictEqual({
        message: '1 quest file could not be read \u2014 see the unreadable rows in the quest list',
        color: 'red',
      });
    });

    it('EMPTY: {list reports no unreadable quest files} => raises no toast and renders no unreadable row', async () => {
      const proxy = HomeContentWidgetProxy();

      proxy.setupDirectoryBrowse({ entries: [] });
      const guildId = GuildIdStub({ value: 'c4c4c3d4-e5f6-7890-abcd-ef1234567890' });
      const guild = GuildListItemStub({ id: guildId, name: 'Healthy Guild' });
      writeItem({ key: GUILD_STORAGE_KEY, value: guildId });

      proxy.setupGuilds({ guilds: [guild] });
      proxy.setupSessions({ sessions: [] });
      proxy.setupQuests({
        quests: [QuestListItemStub({ id: QuestIdStub({ value: 'only-quest' }) })],
      });

      await act(async () => {
        mantineRenderMiddleware({
          ui: (
            <MemoryRouter>
              <HomeContentWidget />
            </MemoryRouter>
          ),
        });
        await Promise.resolve();
      });

      await waitFor(() => {
        expect(screen.getByTestId('QUEST_ITEM_only-quest').tagName).toBe('DIV');
      });

      expect(proxy.getUnreadableQuestRowTexts()).toStrictEqual([]);
      expect(proxy.getShowToastCalls()).toStrictEqual([]);
    });
  });
});
