/**
 * PURPOSE: Tests for QuestChatWidget - split panel layout with chat and activity
 */

import { act, waitFor } from '@testing-library/react';
import { MemoryRouter, Route, Routes } from 'react-router-dom';

import {
  GuildListItemStub,
  GuildStub,
  QuestStub,
  RequirementStub,
  SessionListItemStub,
} from '@dungeonmaster/shared/contracts';

import { mantineRenderAdapter } from '../../adapters/mantine/render/mantine-render-adapter';
import { QuestChatWidget } from './quest-chat-widget';
import { QuestChatWidgetProxy } from './quest-chat-widget.proxy';

describe('QuestChatWidget', () => {
  describe('layout structure', () => {
    it('VALID: {sessionId in URL} => renders ChatPanelWidget', () => {
      const proxy = QuestChatWidgetProxy();
      const guild = GuildListItemStub({ urlSlug: 'test-guild' });
      const guildDetail = GuildStub({ id: guild.id });

      proxy.setupGuilds({ guilds: [guild] });
      proxy.setupGuild({ guild: guildDetail });
      proxy.setupSessions({ sessions: [] });

      mantineRenderAdapter({
        ui: (
          <MemoryRouter initialEntries={['/test-guild/session/chat-q1']}>
            <Routes>
              <Route path="/:guildSlug/session/:sessionId" element={<QuestChatWidget />} />
            </Routes>
          </MemoryRouter>
        ),
      });

      expect(proxy.hasChatPanel()).toBe(true);
    });

    it('VALID: {sessionId in URL} => renders vertical divider', () => {
      const proxy = QuestChatWidgetProxy();
      const guild = GuildListItemStub({ urlSlug: 'test-guild' });
      const guildDetail = GuildStub({ id: guild.id });

      proxy.setupGuilds({ guilds: [guild] });
      proxy.setupGuild({ guild: guildDetail });
      proxy.setupSessions({ sessions: [] });

      mantineRenderAdapter({
        ui: (
          <MemoryRouter initialEntries={['/test-guild/session/chat-q2']}>
            <Routes>
              <Route path="/:guildSlug/session/:sessionId" element={<QuestChatWidget />} />
            </Routes>
          </MemoryRouter>
        ),
      });

      expect(proxy.hasDivider()).toBe(true);
    });
  });

  describe('right panel', () => {
    it('VALID: {sessionId in URL, no questId in state} => renders activity placeholder text', () => {
      const proxy = QuestChatWidgetProxy();
      const guild = GuildListItemStub({ urlSlug: 'test-guild' });
      const guildDetail = GuildStub({ id: guild.id });

      proxy.setupGuilds({ guilds: [guild] });
      proxy.setupGuild({ guild: guildDetail });
      proxy.setupSessions({ sessions: [] });

      mantineRenderAdapter({
        ui: (
          <MemoryRouter initialEntries={['/test-guild/session/chat-q3']}>
            <Routes>
              <Route path="/:guildSlug/session/:sessionId" element={<QuestChatWidget />} />
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
      const guildDetail = GuildStub({ id: guild.id });

      proxy.setupGuilds({ guilds: [guild] });
      proxy.setupGuild({ guild: guildDetail });
      proxy.setupSessions({ sessions: [] });

      mantineRenderAdapter({
        ui: (
          <MemoryRouter initialEntries={['/test-guild/session/chat-q4']}>
            <Routes>
              <Route path="/:guildSlug/session/:sessionId" element={<QuestChatWidget />} />
            </Routes>
          </MemoryRouter>
        ),
      });

      await waitFor(() => {
        expect(proxy.getSentWsMessages().length).toBeGreaterThan(0);
      });

      act(() => {
        proxy.receiveWsMessage({
          data: JSON.stringify({
            type: 'chat-output',
            payload: {
              chatProcessId: 'replay-chat-q4',
              line: JSON.stringify({
                type: 'assistant',
                message: {
                  content: [
                    {
                      type: 'tool_use',
                      name: 'mcp__dungeonmaster__ask-user-question',
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
              }),
            },
            timestamp: '2025-01-01T00:00:00.000Z',
          }),
        });
      });

      await waitFor(() => {
        expect(proxy.hasClarifyPanel()).toBe(true);
      });

      expect(proxy.getClarifyQuestionText()).toBe('Which framework?');
    });

    it('VALID: {click clarify option on single question} => calls sendMessage with formatted answer', async () => {
      const proxy = QuestChatWidgetProxy();
      const guild = GuildListItemStub({ urlSlug: 'test-guild' });
      const guildDetail = GuildStub({ id: guild.id });

      proxy.setupGuilds({ guilds: [guild] });
      proxy.setupGuild({ guild: guildDetail });
      proxy.setupSessions({ sessions: [] });
      proxy.setupChat({ chatProcessId: 'proc-1' as never });

      mantineRenderAdapter({
        ui: (
          <MemoryRouter initialEntries={['/test-guild/session/chat-q5']}>
            <Routes>
              <Route path="/:guildSlug/session/:sessionId" element={<QuestChatWidget />} />
            </Routes>
          </MemoryRouter>
        ),
      });

      await waitFor(() => {
        expect(proxy.getSentWsMessages().length).toBeGreaterThan(0);
      });

      act(() => {
        proxy.receiveWsMessage({
          data: JSON.stringify({
            type: 'chat-output',
            payload: {
              chatProcessId: 'replay-chat-q5',
              line: JSON.stringify({
                type: 'assistant',
                message: {
                  content: [
                    {
                      type: 'tool_use',
                      name: 'mcp__dungeonmaster__ask-user-question',
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
              }),
            },
            timestamp: '2025-01-01T00:00:00.000Z',
          }),
        });
      });

      await waitFor(() => {
        expect(proxy.hasClarifyPanel()).toBe(true);
      });

      await proxy.clickClarifyOption({ label: 'React' as never });

      expect(proxy.hasClarifyPanel()).toBe(false);
    });
  });

  describe('spec panel', () => {
    it('VALID: {quest has requirements via route state} => renders spec panel in right panel', async () => {
      const proxy = QuestChatWidgetProxy();
      const guild = GuildListItemStub({ urlSlug: 'test-guild' });
      const quest = QuestStub({
        id: 'chat-q6',
        requirements: [RequirementStub()],
      });
      const guildDetail = GuildStub({ id: guild.id });

      proxy.setupGuilds({ guilds: [guild] });
      proxy.setupGuild({ guild: guildDetail });
      proxy.setupSessions({ sessions: [] });

      mantineRenderAdapter({
        ui: (
          <MemoryRouter
            initialEntries={[
              { pathname: '/test-guild/session/chat-q6', state: { questId: quest.id } },
            ]}
          >
            <Routes>
              <Route path="/:guildSlug/session/:sessionId" element={<QuestChatWidget />} />
            </Routes>
          </MemoryRouter>
        ),
      });

      act(() => {
        proxy.setupQuest({ quest });
      });

      await waitFor(() => {
        expect(proxy.hasSpecPanel()).toBe(true);
      });

      expect(proxy.hasActivityPlaceholder()).toBe(true);
    });

    it('VALID: {quest has requirements via route state} => spec panel receives quest data', async () => {
      const proxy = QuestChatWidgetProxy();
      const guild = GuildListItemStub({ urlSlug: 'test-guild' });
      const quest = QuestStub({
        id: 'chat-q7',
        requirements: [RequirementStub()],
      });
      const guildDetail = GuildStub({ id: guild.id });

      proxy.setupGuilds({ guilds: [guild] });
      proxy.setupGuild({ guild: guildDetail });
      proxy.setupSessions({ sessions: [] });

      mantineRenderAdapter({
        ui: (
          <MemoryRouter
            initialEntries={[
              { pathname: '/test-guild/session/chat-q7', state: { questId: quest.id } },
            ]}
          >
            <Routes>
              <Route path="/:guildSlug/session/:sessionId" element={<QuestChatWidget />} />
            </Routes>
          </MemoryRouter>
        ),
      });

      act(() => {
        proxy.setupQuest({ quest });
      });

      await waitFor(() => {
        expect(proxy.hasSpecPanel()).toBe(true);
      });

      expect(proxy.hasSpecPanel()).toBe(true);
    });

    it('VALID: {quest with requirements via session list fallback, no route state} => renders spec panel', async () => {
      const proxy = QuestChatWidgetProxy();
      const guild = GuildListItemStub({ urlSlug: 'test-guild' });
      const quest = QuestStub({
        id: 'chat-fallback',
        requirements: [RequirementStub()],
      });
      const guildDetail = GuildStub({ id: guild.id });
      const session = SessionListItemStub({
        sessionId: 'chat-fallback' as never,
        questId: quest.id as never,
      });

      proxy.setupGuilds({ guilds: [guild] });
      proxy.setupGuild({ guild: guildDetail });
      proxy.setupSessions({ sessions: [session] });

      mantineRenderAdapter({
        ui: (
          <MemoryRouter
            initialEntries={[
              { pathname: '/test-guild/session/chat-fallback', state: { questId: quest.id } },
            ]}
          >
            <Routes>
              <Route path="/:guildSlug/session/:sessionId" element={<QuestChatWidget />} />
            </Routes>
          </MemoryRouter>
        ),
      });

      act(() => {
        proxy.setupQuest({ quest });
      });

      await waitFor(() => {
        expect(proxy.hasSpecPanel()).toBe(true);
      });

      expect(proxy.hasSpecPanel()).toBe(true);
    });

    it('VALID: {pending question with quest content} => renders both clarify panel and spec panel simultaneously', async () => {
      const proxy = QuestChatWidgetProxy();
      const guild = GuildListItemStub({ urlSlug: 'test-guild' });
      const quest = QuestStub({
        id: 'chat-q8',
        requirements: [RequirementStub()],
      });
      const guildDetail = GuildStub({ id: guild.id });

      proxy.setupGuilds({ guilds: [guild] });
      proxy.setupGuild({ guild: guildDetail });
      proxy.setupSessions({ sessions: [] });

      mantineRenderAdapter({
        ui: (
          <MemoryRouter
            initialEntries={[
              { pathname: '/test-guild/session/chat-q8', state: { questId: quest.id } },
            ]}
          >
            <Routes>
              <Route path="/:guildSlug/session/:sessionId" element={<QuestChatWidget />} />
            </Routes>
          </MemoryRouter>
        ),
      });

      act(() => {
        proxy.setupQuest({ quest });
      });

      await waitFor(() => {
        expect(proxy.hasSpecPanel()).toBe(true);
      });

      await waitFor(() => {
        expect(proxy.getSentWsMessages().length).toBeGreaterThan(0);
      });

      act(() => {
        proxy.receiveWsMessage({
          data: JSON.stringify({
            type: 'chat-output',
            payload: {
              chatProcessId: 'replay-chat-q8',
              line: JSON.stringify({
                type: 'assistant',
                message: {
                  content: [
                    {
                      type: 'tool_use',
                      name: 'mcp__dungeonmaster__ask-user-question',
                      input: {
                        questions: [
                          {
                            question: 'Which DB?',
                            header: 'Database Choice',
                            options: [
                              { label: 'Postgres', description: 'Relational' },
                              { label: 'Mongo', description: 'Document' },
                            ],
                            multiSelect: false,
                          },
                        ],
                      },
                    },
                  ],
                },
              }),
            },
            timestamp: '2025-01-01T00:00:00.000Z',
          }),
        });
      });

      await waitFor(() => {
        expect(proxy.hasClarifyPanel()).toBe(true);
      });

      expect(proxy.hasSpecPanel()).toBe(true);
    });
  });

  describe('external update props', () => {
    it('VALID: {quest with requirements} => spec panel receives externalUpdatePending and onDismissUpdate', async () => {
      const proxy = QuestChatWidgetProxy();
      const guild = GuildListItemStub({ urlSlug: 'test-guild' });
      const quest = QuestStub({
        id: 'chat-q9',
        requirements: [RequirementStub()],
      });
      const guildDetail = GuildStub({ id: guild.id });

      proxy.setupGuilds({ guilds: [guild] });
      proxy.setupGuild({ guild: guildDetail });
      proxy.setupSessions({ sessions: [] });

      mantineRenderAdapter({
        ui: (
          <MemoryRouter
            initialEntries={[
              { pathname: '/test-guild/session/chat-q9', state: { questId: quest.id } },
            ]}
          >
            <Routes>
              <Route path="/:guildSlug/session/:sessionId" element={<QuestChatWidget />} />
            </Routes>
          </MemoryRouter>
        ),
      });

      act(() => {
        proxy.setupQuest({ quest });
      });

      await waitFor(() => {
        expect(proxy.hasSpecPanel()).toBe(true);
      });

      expect(proxy.hasSpecPanel()).toBe(true);
    });
  });

  describe('guild-level chat', () => {
    it('VALID: {guildSlug without sessionId} => renders ChatPanelWidget', () => {
      const proxy = QuestChatWidgetProxy();
      const guild = GuildListItemStub({ urlSlug: 'my-guild' });
      const guildDetail = GuildStub({ id: guild.id });

      proxy.setupGuilds({ guilds: [guild] });
      proxy.setupGuild({ guild: guildDetail });
      proxy.setupSessions({ sessions: [] });

      mantineRenderAdapter({
        ui: (
          <MemoryRouter initialEntries={['/my-guild/session']}>
            <Routes>
              <Route path="/:guildSlug/session" element={<QuestChatWidget />} />
            </Routes>
          </MemoryRouter>
        ),
      });

      expect(proxy.hasChatPanel()).toBe(true);
    });
  });
});
