/**
 * PURPOSE: Tests for QuestChatWidget - split panel layout with chat and activity
 */

import { waitFor } from '@testing-library/react';
import { MemoryRouter, Route, Routes } from 'react-router-dom';

import {
  ChatSessionStub,
  GuildListItemStub,
  GuildStub,
  QuestStub,
} from '@dungeonmaster/shared/contracts';

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

  describe('clarify panel', () => {
    it('VALID: {entries with pending AskUserQuestion} => renders clarify panel in right panel', async () => {
      const proxy = QuestChatWidgetProxy();
      const guild = GuildListItemStub({ urlSlug: 'test-guild' });
      const chatSession = ChatSessionStub({ active: true });
      const quest = QuestStub({ id: 'chat-q4', chatSessions: [chatSession] });

      proxy.setupGuilds({ guilds: [guild] });
      proxy.setupQuest({ quest });
      proxy.setupQuestHistory({
        entries: [
          {
            type: 'assistant',
            message: {
              content: [
                {
                  type: 'tool_use',
                  name: 'AskUserQuestion',
                  input: {
                    questions: [
                      {
                        question: 'Which framework?',
                        header: 'Framework Choice',
                        options: [
                          { label: 'React', description: 'Component-based UI' },
                          { label: 'Vue', description: 'Progressive framework' },
                        ],
                        multiSelect: false,
                      },
                    ],
                  },
                },
              ],
            },
          },
        ],
      });

      mantineRenderAdapter({
        ui: (
          <MemoryRouter initialEntries={['/test-guild/quest/chat-q4']}>
            <Routes>
              <Route path="/:guildSlug/quest/:questSlug" element={<QuestChatWidget />} />
            </Routes>
          </MemoryRouter>
        ),
      });

      await waitFor(() => {
        expect(proxy.hasClarifyPanel()).toBe(true);
      });

      expect(proxy.getClarifyQuestionText()).toBe('Which framework?');
    });

    it('VALID: {click clarify option} => calls sendMessage with selected label', async () => {
      const proxy = QuestChatWidgetProxy();
      const guild = GuildListItemStub({ urlSlug: 'test-guild' });
      const chatSession = ChatSessionStub({ active: true });
      const quest = QuestStub({ id: 'chat-q5', chatSessions: [chatSession] });

      proxy.setupGuilds({ guilds: [guild] });
      proxy.setupQuest({ quest });
      proxy.setupChat({ chatProcessId: 'proc-1' as never });
      proxy.setupQuestHistory({
        entries: [
          {
            type: 'assistant',
            message: {
              content: [
                {
                  type: 'tool_use',
                  name: 'AskUserQuestion',
                  input: {
                    questions: [
                      {
                        question: 'Which framework?',
                        header: 'Framework Choice',
                        options: [
                          { label: 'React', description: 'Component-based UI' },
                          { label: 'Vue', description: 'Progressive framework' },
                        ],
                        multiSelect: false,
                      },
                    ],
                  },
                },
              ],
            },
          },
        ],
      });

      mantineRenderAdapter({
        ui: (
          <MemoryRouter initialEntries={['/test-guild/quest/chat-q5']}>
            <Routes>
              <Route path="/:guildSlug/quest/:questSlug" element={<QuestChatWidget />} />
            </Routes>
          </MemoryRouter>
        ),
      });

      await waitFor(() => {
        expect(proxy.hasClarifyPanel()).toBe(true);
      });

      await proxy.clickClarifyOption({ label: 'React' as never });

      expect(proxy.hasClarifyPanel()).toBe(false);
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
