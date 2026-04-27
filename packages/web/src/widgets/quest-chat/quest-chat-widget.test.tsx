/**
 * PURPOSE: Tests for QuestChatWidget — the thin wrapper that reads URL params, looks up the matched guild, and delegates to QuestChatRoutingLayerWidget.
 */

import { waitFor } from '@testing-library/react';
import { MemoryRouter, Route, Routes } from 'react-router-dom';

import { GuildListItemStub } from '@dungeonmaster/shared/contracts';

import { mantineRenderAdapter } from '../../adapters/mantine/render/mantine-render-adapter';
import { testingLibraryActAsyncAdapter } from '../../adapters/testing-library/act-async/testing-library-act-async-adapter';
import { QuestChatWidget } from './quest-chat-widget';
import { QuestChatWidgetProxy } from './quest-chat-widget.proxy';

const renderAt = ({ path, url }: { path: string; url: string }): void => {
  mantineRenderAdapter({
    ui: (
      <MemoryRouter initialEntries={[url]}>
        <Routes>
          <Route path={path} element={<QuestChatWidget />} />
        </Routes>
      </MemoryRouter>
    ),
  });
};

describe('QuestChatWidget', () => {
  describe('routing delegation', () => {
    it('VALID: {/:guildSlug/quest/:questId, guild matches, no quest yet} => delegates to routing layer (QUEST_CHAT_LOADING)', async () => {
      const proxy = QuestChatWidgetProxy();
      const guild = GuildListItemStub({ urlSlug: 'my-guild' as never });
      proxy.setupGuilds({ guilds: [guild] });

      await testingLibraryActAsyncAdapter({
        callback: async () => {
          renderAt({
            path: '/:guildSlug/quest/:questId',
            url: '/my-guild/quest/abc-123',
          });
          await Promise.resolve();
        },
      });

      await waitFor(() => {
        expect(proxy.hasQuestChatLoading()).toBe(true);
      });

      expect(proxy.hasQuestChatLoading()).toBe(true);
    });

    it('VALID: {/:guildSlug/quest, guild matches, no questId} => delegates to routing layer (CHAT_PANEL/QUEST_CHAT)', async () => {
      const proxy = QuestChatWidgetProxy();
      const guild = GuildListItemStub({ urlSlug: 'my-guild' as never });
      proxy.setupGuilds({ guilds: [guild] });

      await testingLibraryActAsyncAdapter({
        callback: async () => {
          renderAt({
            path: '/:guildSlug/quest',
            url: '/my-guild/quest',
          });
          await Promise.resolve();
        },
      });

      await waitFor(() => {
        expect(proxy.hasQuestChat()).toBe(true);
      });

      expect(proxy.hasQuestChat()).toBe(true);
    });

    it('VALID: {/:guildSlug/quest, guild does NOT match, guildsLoading false} => delegates to routing layer (NOT_FOUND)', async () => {
      const proxy = QuestChatWidgetProxy();
      proxy.setupGuilds({ guilds: [] });

      await testingLibraryActAsyncAdapter({
        callback: async () => {
          renderAt({
            path: '/:guildSlug/quest',
            url: '/missing-guild/quest',
          });
          await Promise.resolve();
        },
      });

      await waitFor(() => {
        expect(proxy.hasNotFound()).toBe(true);
      });

      expect(proxy.hasNotFound()).toBe(true);
    });
  });
});
