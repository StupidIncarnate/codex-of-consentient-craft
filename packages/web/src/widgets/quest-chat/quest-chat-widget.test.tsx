/**
 * PURPOSE: Tests for QuestChatWidget — the thin wrapper that reads URL params, looks up the matched guild, and delegates to QuestChatRoutingLayerWidget.
 */

import { render, waitFor } from '#gateway/npm/testing-library__react';
import { MemoryRouter, Route, Routes } from '#gateway/npm/react-router-dom';

import { GuildListItemStub } from '@dungeonmaster/shared/contracts/guild-list-item/guild-list-item.stub';

import { act } from '#gateway/npm/testing-library__react';
import { QuestChatWidget } from './quest-chat-widget';
import { QuestChatWidgetProxy } from './quest-chat-widget.proxy';

const renderAt = ({ path, url }: { path: string; url: string }): void => {
  render({
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
    it('VALID: {/:guildSlug/quest/:questId, guild matches, no quest yet} => delegates to content layer (QUEST_CHAT awaiting surface)', async () => {
      const proxy = QuestChatWidgetProxy();
      const guild = GuildListItemStub({ urlSlug: 'my-guild' });
      proxy.setupGuilds({ guilds: [guild] });
      proxy.setupMode({ mode: 'claude' });

      await act(async () => {
        renderAt({
          path: '/:guildSlug/quest/:questId',
          url: '/my-guild/quest/abc-123',
        });
        await Promise.resolve();
      });

      await waitFor(() => {
        expect(proxy.hasQuestChat()).toBe(true);
      });

      expect(proxy.hasQuestChat()).toBe(true);
    });

    it('VALID: {/:guildSlug/quest, guild matches, no questId} => delegates to routing layer (CHAT_PANEL/QUEST_CHAT)', async () => {
      const proxy = QuestChatWidgetProxy();
      const guild = GuildListItemStub({ urlSlug: 'my-guild' });
      proxy.setupGuilds({ guilds: [guild] });
      proxy.setupMode({ mode: 'claude' });

      await act(async () => {
        renderAt({
          path: '/:guildSlug/quest',
          url: '/my-guild/quest',
        });
        await Promise.resolve();
      });

      await waitFor(() => {
        expect(proxy.hasQuestChat()).toBe(true);
      });

      expect(proxy.hasQuestChat()).toBe(true);
    });

    it('VALID: {/:guildSlug/quest, guild does NOT match, guildsLoading false} => delegates to routing layer (NOT_FOUND)', async () => {
      const proxy = QuestChatWidgetProxy();
      proxy.setupGuilds({ guilds: [] });

      await act(async () => {
        renderAt({
          path: '/:guildSlug/quest',
          url: '/missing-guild/quest',
        });
        await Promise.resolve();
      });

      await waitFor(() => {
        expect(proxy.hasNotFound()).toBe(true);
      });

      expect(proxy.hasNotFound()).toBe(true);
    });
  });
});
