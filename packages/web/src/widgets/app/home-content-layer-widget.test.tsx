/**
 * PURPOSE: Tests for HomeContentLayerWidget - guild selection and session list rendering
 */

import { waitFor } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { GuildIdStub, GuildListItemStub } from '@dungeonmaster/shared/contracts';

import { mantineRenderAdapter } from '../../adapters/mantine/render/mantine-render-adapter';
import { testingLibraryActAsyncAdapter } from '../../adapters/testing-library/act-async/testing-library-act-async-adapter';
import { HomeContentLayerWidget } from './home-content-layer-widget';
import { HomeContentLayerWidgetProxy } from './home-content-layer-widget.proxy';

describe('HomeContentLayerWidget', () => {
  describe('empty state', () => {
    it('VALID: {no guilds} => shows NEW GUILD form', async () => {
      const proxy = HomeContentLayerWidgetProxy();

      proxy.setupGuilds({ guilds: [] });

      await testingLibraryActAsyncAdapter({
        callback: async () => {
          mantineRenderAdapter({
            ui: (
              <MemoryRouter>
                <HomeContentLayerWidget />
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
      const proxy = HomeContentLayerWidgetProxy();
      const guild = GuildListItemStub({ name: 'Guild One' });
      const guilds = [guild];

      proxy.setupGuilds({ guilds });

      await testingLibraryActAsyncAdapter({
        callback: async () => {
          mantineRenderAdapter({
            ui: (
              <MemoryRouter>
                <HomeContentLayerWidget />
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
      const proxy = HomeContentLayerWidgetProxy();
      const guilds = [GuildListItemStub({ name: 'My Guild' })];

      proxy.setupGuilds({ guilds });

      await testingLibraryActAsyncAdapter({
        callback: async () => {
          mantineRenderAdapter({
            ui: (
              <MemoryRouter>
                <HomeContentLayerWidget />
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
      const proxy = HomeContentLayerWidgetProxy();
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
                <HomeContentLayerWidget />
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
});
