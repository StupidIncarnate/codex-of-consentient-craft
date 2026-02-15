/**
 * PURPOSE: Tests for QuestChatWidget - split panel layout with chat and activity
 */

import { MemoryRouter, Route, Routes } from 'react-router-dom';

import { GuildListItemStub, GuildStub, QuestStub } from '@dungeonmaster/shared/contracts';

import { mantineRenderAdapter } from '../../adapters/mantine/render/mantine-render-adapter';
import { QuestChatWidget } from './quest-chat-widget';
import { QuestChatWidgetProxy } from './quest-chat-widget.proxy';

describe('QuestChatWidget', () => {
  describe('layout structure', () => {
    it('VALID: {questSlug in URL} => renders ChatPanelWidget', () => {
      const proxy = QuestChatWidgetProxy();
      const guild = GuildListItemStub({ urlSlug: 'test-guild' });
      const quest = QuestStub({ id: 'chat-q1' });

      proxy.setupGuilds({ guilds: [guild] });
      proxy.setupQuest({ quest });

      mantineRenderAdapter({
        ui: (
          <MemoryRouter initialEntries={['/test-guild/quest/chat-q1']}>
            <Routes>
              <Route path="/:guildSlug/quest/:questSlug" element={<QuestChatWidget />} />
            </Routes>
          </MemoryRouter>
        ),
      });

      expect(proxy.hasChatPanel()).toBe(true);
    });

    it('VALID: {questSlug in URL} => renders vertical divider', () => {
      const proxy = QuestChatWidgetProxy();
      const guild = GuildListItemStub({ urlSlug: 'test-guild' });
      const quest = QuestStub({ id: 'chat-q2' });

      proxy.setupGuilds({ guilds: [guild] });
      proxy.setupQuest({ quest });

      mantineRenderAdapter({
        ui: (
          <MemoryRouter initialEntries={['/test-guild/quest/chat-q2']}>
            <Routes>
              <Route path="/:guildSlug/quest/:questSlug" element={<QuestChatWidget />} />
            </Routes>
          </MemoryRouter>
        ),
      });

      expect(proxy.hasDivider()).toBe(true);
    });
  });

  describe('right panel', () => {
    it('VALID: {questSlug in URL} => renders activity placeholder text', () => {
      const proxy = QuestChatWidgetProxy();
      const guild = GuildListItemStub({ urlSlug: 'test-guild' });
      const quest = QuestStub({ id: 'chat-q3' });

      proxy.setupGuilds({ guilds: [guild] });
      proxy.setupQuest({ quest });

      mantineRenderAdapter({
        ui: (
          <MemoryRouter initialEntries={['/test-guild/quest/chat-q3']}>
            <Routes>
              <Route path="/:guildSlug/quest/:questSlug" element={<QuestChatWidget />} />
            </Routes>
          </MemoryRouter>
        ),
      });

      expect(proxy.hasActivityPlaceholder()).toBe(true);
      expect(proxy.getActivityText()).toBe('Awaiting quest activity...');
    });
  });

  describe('guild-level chat', () => {
    it('VALID: {guildSlug without questSlug} => renders ChatPanelWidget', () => {
      const proxy = QuestChatWidgetProxy();
      const guild = GuildListItemStub({ urlSlug: 'my-guild' });
      const guildDetail = GuildStub({ id: guild.id });

      proxy.setupGuilds({ guilds: [guild] });
      proxy.setupGuild({ guild: guildDetail });

      mantineRenderAdapter({
        ui: (
          <MemoryRouter initialEntries={['/my-guild/quest']}>
            <Routes>
              <Route path="/:guildSlug/quest" element={<QuestChatWidget />} />
            </Routes>
          </MemoryRouter>
        ),
      });

      expect(proxy.hasChatPanel()).toBe(true);
    });
  });
});
