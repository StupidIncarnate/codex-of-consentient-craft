/**
 * PURPOSE: Tests for HomeContentWidget - guild selection and session list rendering
 */

import { waitFor } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { GuildIdStub, GuildListItemStub } from '@dungeonmaster/shared/contracts';

import { mantineRenderAdapter } from '../../adapters/mantine/render/mantine-render-adapter';
import { testingLibraryActAsyncAdapter } from '../../adapters/testing-library/act-async/testing-library-act-async-adapter';
import { HomeContentWidget } from './home-content-widget';
import { HomeContentWidgetProxy } from './home-content-widget.proxy';

const GUILD_STORAGE_KEY = 'dungeonmaster-last-guild';

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
