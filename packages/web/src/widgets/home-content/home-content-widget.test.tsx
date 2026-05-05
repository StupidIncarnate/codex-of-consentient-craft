/**
 * PURPOSE: Tests for HomeContentWidget - guild selection and session list rendering
 */

import { screen, waitFor } from '@testing-library/react';
import { MemoryRouter, Route, Routes, useLocation } from 'react-router-dom';
import {
  GuildIdStub,
  GuildListItemStub,
  QuestIdStub,
  SessionIdStub,
  SessionListItemStub,
} from '@dungeonmaster/shared/contracts';

import { mantineRenderAdapter } from '../../adapters/mantine/render/mantine-render-adapter';
import { testingLibraryActAsyncAdapter } from '../../adapters/testing-library/act-async/testing-library-act-async-adapter';
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

      proxy.setupGuilds({ guilds: [] });

      await testingLibraryActAsyncAdapter({
        callback: async () => {
          mantineRenderAdapter({
            ui: (
              <MemoryRouter>
                <HomeContentWidget />
              </MemoryRouter>
            ),
          });
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
      const proxy = HomeContentWidgetProxy();
      const guild = GuildListItemStub({ name: 'Guild One' });
      const guilds = [guild];

      proxy.setupGuilds({ guilds });

      await testingLibraryActAsyncAdapter({
        callback: async () => {
          mantineRenderAdapter({
            ui: (
              <MemoryRouter>
                <HomeContentWidget />
              </MemoryRouter>
            ),
          });
          await Promise.resolve();
        },
      });

      await waitFor(() => {
        expect(proxy.isGuildItemVisible({ testId: `GUILD_ITEM_${guild.id}` })).toBe(true);
      });

      expect(proxy.isGuildItemVisible({ testId: `GUILD_ITEM_${guild.id}` })).toBe(true);
    });

    it('VALID: {no guild selected} => shows select a guild message', async () => {
      const proxy = HomeContentWidgetProxy();
      const guilds = [GuildListItemStub({ name: 'My Guild' })];

      proxy.setupGuilds({ guilds });

      await testingLibraryActAsyncAdapter({
        callback: async () => {
          mantineRenderAdapter({
            ui: (
              <MemoryRouter>
                <HomeContentWidget />
              </MemoryRouter>
            ),
          });
          await Promise.resolve();
        },
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
      const guildId = GuildIdStub({ value: 'a1b2c3d4-e5f6-7890-abcd-ef1234567890' });
      const createdGuild = GuildListItemStub({
        id: guildId,
        name: 'new-guild',
      });

      proxy.setupGuilds({ guilds: [] });

      await testingLibraryActAsyncAdapter({
        callback: async () => {
          mantineRenderAdapter({
            ui: (
              <MemoryRouter>
                <HomeContentWidget />
              </MemoryRouter>
            ),
          });
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
      proxy.setupSessions({ sessions: [] });

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
  });

  describe('localStorage guild persistence', () => {
    it('VALID: {click guild} => saves guild ID to localStorage', async () => {
      const proxy = HomeContentWidgetProxy();
      proxy.clearStorage();
      const guild = GuildListItemStub({ name: 'Persist Guild' });

      proxy.setupGuilds({ guilds: [guild] });

      await testingLibraryActAsyncAdapter({
        callback: async () => {
          mantineRenderAdapter({
            ui: (
              <MemoryRouter>
                <HomeContentWidget />
              </MemoryRouter>
            ),
          });
          await Promise.resolve();
        },
      });

      await waitFor(() => {
        expect(proxy.isGuildItemVisible({ testId: `GUILD_ITEM_${guild.id}` })).toBe(true);
      });

      proxy.setupSessions({ sessions: [] });

      await testingLibraryActAsyncAdapter({
        callback: async () => {
          await proxy.clickGuildItem({ testId: `GUILD_ITEM_${guild.id}` });
          await Promise.resolve();
        },
      });

      await waitFor(() => {
        expect(localStorage.getItem(GUILD_STORAGE_KEY)).toBe(guild.id);
      });

      expect(localStorage.getItem(GUILD_STORAGE_KEY)).toBe(guild.id);
    });

    it('VALID: {stored guild in localStorage, guild exists} => auto-selects guild on mount', async () => {
      const proxy = HomeContentWidgetProxy();
      proxy.clearStorage();
      const guild = GuildListItemStub({ name: 'Stored Guild' });

      localStorage.setItem(GUILD_STORAGE_KEY, guild.id);

      proxy.setupGuilds({ guilds: [guild] });
      proxy.setupSessions({ sessions: [] });

      await testingLibraryActAsyncAdapter({
        callback: async () => {
          mantineRenderAdapter({
            ui: (
              <MemoryRouter>
                <HomeContentWidget />
              </MemoryRouter>
            ),
          });
          await Promise.resolve();
        },
      });

      await waitFor(() => {
        expect(proxy.isGuildItemSelected({ testId: `GUILD_ITEM_${guild.id}` })).toBe(true);
      });

      expect(proxy.isGuildItemSelected({ testId: `GUILD_ITEM_${guild.id}` })).toBe(true);
    });

    it('VALID: {stored guild in localStorage, guild not in list} => clears localStorage', async () => {
      const proxy = HomeContentWidgetProxy();
      proxy.clearStorage();
      const staleGuildId = GuildIdStub({ value: 'aaaaaaaa-bbbb-cccc-dddd-eeeeeeeeeeee' });
      const realGuild = GuildListItemStub({ name: 'Real Guild' });

      localStorage.setItem(GUILD_STORAGE_KEY, staleGuildId);

      proxy.setupGuilds({ guilds: [realGuild] });

      await testingLibraryActAsyncAdapter({
        callback: async () => {
          mantineRenderAdapter({
            ui: (
              <MemoryRouter>
                <HomeContentWidget />
              </MemoryRouter>
            ),
          });
          await Promise.resolve();
        },
      });

      await waitFor(() => {
        expect(localStorage.getItem(GUILD_STORAGE_KEY)).toBe(null);
      });

      expect(localStorage.getItem(GUILD_STORAGE_KEY)).toBe(null);
      expect(proxy.isSelectGuildMessageVisible()).toBe(true);
    });

    it('EMPTY: {no stored guild} => shows select a guild message', async () => {
      const proxy = HomeContentWidgetProxy();
      proxy.clearStorage();
      const guilds = [GuildListItemStub({ name: 'Some Guild' })];

      proxy.setupGuilds({ guilds });

      await testingLibraryActAsyncAdapter({
        callback: async () => {
          mantineRenderAdapter({
            ui: (
              <MemoryRouter>
                <HomeContentWidget />
              </MemoryRouter>
            ),
          });
          await Promise.resolve();
        },
      });

      await waitFor(() => {
        expect(proxy.isSelectGuildMessageVisible()).toBe(true);
      });

      expect(proxy.isSelectGuildMessageVisible()).toBe(true);
      expect(localStorage.getItem(GUILD_STORAGE_KEY)).toBe(null);
    });
  });

  describe('navigation', () => {
    it('VALID: {click session add button} => navigates to /:guildSlug/quest (no session)', async () => {
      const proxy = HomeContentWidgetProxy();
      proxy.clearStorage();
      const guild = GuildListItemStub({
        id: GuildIdStub({ value: 'b1b2c3d4-e5f6-7890-abcd-ef1234567890' }),
        name: 'Nav Guild',
        urlSlug: 'nav-guild' as never,
      });

      proxy.setupGuilds({ guilds: [guild] });
      proxy.setupSessions({ sessions: [] });

      await testingLibraryActAsyncAdapter({
        callback: async () => {
          mantineRenderAdapter({
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
        },
      });

      await waitFor(() => {
        expect(proxy.isGuildItemVisible({ testId: `GUILD_ITEM_${guild.id}` })).toBe(true);
      });

      await testingLibraryActAsyncAdapter({
        callback: async () => {
          await proxy.clickGuildItem({ testId: `GUILD_ITEM_${guild.id}` });
          await Promise.resolve();
        },
      });

      await testingLibraryActAsyncAdapter({
        callback: async () => {
          await proxy.clickAddSession();
          await Promise.resolve();
        },
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
      proxy.clearStorage();
      const guild = GuildListItemStub({
        id: GuildIdStub({ value: 'c1b2c3d4-e5f6-7890-abcd-ef1234567890' }),
        name: 'Session Guild',
        urlSlug: 'session-guild' as never,
      });
      const sessionId = SessionIdStub({ value: 'd1b2c3d4-e5f6-7890-abcd-ef1234567890' });
      const questId = QuestIdStub({ value: 'e1b2c3d4-e5f6-7890-abcd-ef1234567890' });
      const session = SessionListItemStub({
        sessionId,
        questId,
        questTitle: 'A Quest' as never,
      });

      proxy.setupGuilds({ guilds: [guild] });
      proxy.setupSessions({ sessions: [session] });

      await testingLibraryActAsyncAdapter({
        callback: async () => {
          mantineRenderAdapter({
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
        },
      });

      await waitFor(() => {
        expect(proxy.isGuildItemVisible({ testId: `GUILD_ITEM_${guild.id}` })).toBe(true);
      });

      await testingLibraryActAsyncAdapter({
        callback: async () => {
          await proxy.clickGuildItem({ testId: `GUILD_ITEM_${guild.id}` });
          await Promise.resolve();
        },
      });

      await waitFor(() => {
        const sessionEl = screen.getByTestId(`SESSION_ITEM_${sessionId}`);

        expect(sessionEl.tagName).toBe('BUTTON');
      });

      await testingLibraryActAsyncAdapter({
        callback: async () => {
          await proxy.clickSessionItem({ testId: `SESSION_ITEM_${sessionId}` });
          await Promise.resolve();
        },
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
      proxy.clearStorage();
      const guild = GuildListItemStub({
        id: GuildIdStub({ value: 'c1b2c3d4-e5f6-7890-abcd-ef1234567891' }),
        name: 'Orphan Session Guild',
        urlSlug: 'orphan-session-guild' as never,
      });
      const sessionId = SessionIdStub({ value: 'd1b2c3d4-e5f6-7890-abcd-ef1234567891' });
      const session = SessionListItemStub({ sessionId });

      proxy.setupGuilds({ guilds: [guild] });
      proxy.setupSessions({ sessions: [session] });

      await testingLibraryActAsyncAdapter({
        callback: async () => {
          mantineRenderAdapter({
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
        },
      });

      await waitFor(() => {
        expect(proxy.isGuildItemVisible({ testId: `GUILD_ITEM_${guild.id}` })).toBe(true);
      });

      await testingLibraryActAsyncAdapter({
        callback: async () => {
          await proxy.clickGuildItem({ testId: `GUILD_ITEM_${guild.id}` });
          await Promise.resolve();
        },
      });

      // Orphan filter — toggle to "All" so the no-quest row is visible
      await testingLibraryActAsyncAdapter({
        callback: async () => {
          await proxy.selectAllSessionsFilter();
          await Promise.resolve();
        },
      });

      await waitFor(() => {
        const sessionEl = screen.getByTestId(`SESSION_ITEM_${sessionId}`);

        expect(sessionEl.tagName).toBe('BUTTON');
      });

      await testingLibraryActAsyncAdapter({
        callback: async () => {
          await proxy.clickSessionItem({ testId: `SESSION_ITEM_${sessionId}` });
          await Promise.resolve();
        },
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
      const consoleErrorSpy = proxy.setupConsoleErrorCapture();

      proxy.setupGuilds({ guilds: [] });

      await testingLibraryActAsyncAdapter({
        callback: async () => {
          mantineRenderAdapter({
            ui: (
              <MemoryRouter>
                <HomeContentWidget />
              </MemoryRouter>
            ),
          });
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

      proxy.setupCreateGuildError();

      await testingLibraryActAsyncAdapter({
        callback: async () => {
          await proxy.clickCreateGuild();
          await Promise.resolve();
        },
      });

      await waitFor(() => {
        expect(
          consoleErrorSpy.mock.calls.some((c) => c[0] === '[home-content] guild create failed'),
        ).toBe(true);
      });

      expect(
        consoleErrorSpy.mock.calls.some((c) => c[0] === '[home-content] guild create failed'),
      ).toBe(true);
    });
  });
});
