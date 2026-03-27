/**
 * PURPOSE: Tests for QuestChatWidget - split panel layout with chat and activity
 */

import { act, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter, Route, Routes } from 'react-router-dom';

import {
  FlowStub,
  GuildListItemStub,
  GuildStub,
  QuestStub,
  WorkItemStub,
} from '@dungeonmaster/shared/contracts';

import { mantineRenderAdapter } from '../../adapters/mantine/render/mantine-render-adapter';
import { QuestChatWidget } from './quest-chat-widget';
import { QuestChatWidgetProxy } from './quest-chat-widget.proxy';

describe('QuestChatWidget', () => {
  describe('layout structure', () => {
    it('VALID: {sessionId in URL, quest loaded} => renders ChatPanelWidget', async () => {
      const proxy = QuestChatWidgetProxy();
      const guild = GuildListItemStub({ urlSlug: 'test-guild' });
      const guildDetail = GuildStub({ id: guild.id });
      const quest = QuestStub({ id: 'chat-q1', status: 'pending' });

      proxy.setupGuilds({ guilds: [guild] });
      proxy.setupGuild({ guild: guildDetail });

      mantineRenderAdapter({
        ui: (
          <MemoryRouter initialEntries={['/test-guild/session/chat-q1']}>
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
        expect(proxy.hasChatPanel()).toBe(true);
      });

      expect(proxy.hasChatPanel()).toBe(true);
    });

    it('VALID: {sessionId in URL, quest loaded} => renders vertical divider', async () => {
      const proxy = QuestChatWidgetProxy();
      const guild = GuildListItemStub({ urlSlug: 'test-guild' });
      const guildDetail = GuildStub({ id: guild.id });
      const quest = QuestStub({ id: 'chat-q2', status: 'pending' });

      proxy.setupGuilds({ guilds: [guild] });
      proxy.setupGuild({ guild: guildDetail });

      mantineRenderAdapter({
        ui: (
          <MemoryRouter initialEntries={['/test-guild/session/chat-q2']}>
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
        expect(proxy.hasDivider()).toBe(true);
      });

      expect(proxy.hasDivider()).toBe(true);
    });
  });

  describe('right panel', () => {
    it('VALID: {sessionId in URL, no quest data} => renders loading state', () => {
      const proxy = QuestChatWidgetProxy();
      const guild = GuildListItemStub({ urlSlug: 'test-guild' });
      const guildDetail = GuildStub({ id: guild.id });

      proxy.setupGuilds({ guilds: [guild] });
      proxy.setupGuild({ guild: guildDetail });

      mantineRenderAdapter({
        ui: (
          <MemoryRouter initialEntries={['/test-guild/session/chat-q3']}>
            <Routes>
              <Route path="/:guildSlug/session/:sessionId" element={<QuestChatWidget />} />
            </Routes>
          </MemoryRouter>
        ),
      });

      expect(screen.queryByTestId('QUEST_CHAT_LOADING')).not.toBeNull();
      expect(proxy.hasDumpsterRaccoon()).toBe(true);
    });

    it('VALID: {sessionId in URL, quest loaded, no quest content} => renders activity placeholder text', async () => {
      const proxy = QuestChatWidgetProxy();
      const guild = GuildListItemStub({ urlSlug: 'test-guild' });
      const guildDetail = GuildStub({ id: guild.id });
      const quest = QuestStub({ id: 'chat-q3b', status: 'pending' });

      proxy.setupGuilds({ guilds: [guild] });
      proxy.setupGuild({ guild: guildDetail });

      mantineRenderAdapter({
        ui: (
          <MemoryRouter initialEntries={['/test-guild/session/chat-q3b']}>
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
        expect(proxy.hasActivityPlaceholder()).toBe(true);
      });

      expect(proxy.hasActivityPlaceholder()).toBe(true);
    });
  });

  describe('clarify panel', () => {
    it('VALID: {entries with pending AskUserQuestion} => renders clarify panel in right panel', async () => {
      const proxy = QuestChatWidgetProxy();
      const guild = GuildListItemStub({ urlSlug: 'test-guild' });
      const guildDetail = GuildStub({ id: guild.id });
      const quest = QuestStub({ id: 'chat-q4', status: 'pending' });

      proxy.setupGuilds({ guilds: [guild] });
      proxy.setupGuild({ guild: guildDetail });

      mantineRenderAdapter({
        ui: (
          <MemoryRouter initialEntries={['/test-guild/session/chat-q4']}>
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
      const quest = QuestStub({ id: 'chat-q5', status: 'pending' });

      proxy.setupGuilds({ guilds: [guild] });
      proxy.setupGuild({ guild: guildDetail });
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

      act(() => {
        proxy.setupQuest({ quest });
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
    it('VALID: {quest with empty spec via route state} => renders spec panel in right panel', async () => {
      const proxy = QuestChatWidgetProxy();
      const guild = GuildListItemStub({ urlSlug: 'test-guild' });
      const quest = QuestStub({
        id: 'chat-empty-spec',
        status: 'review_flows',
      });
      const guildDetail = GuildStub({ id: guild.id });

      proxy.setupGuilds({ guilds: [guild] });
      proxy.setupGuild({ guild: guildDetail });

      mantineRenderAdapter({
        ui: (
          <MemoryRouter
            initialEntries={[
              { pathname: '/test-guild/session/chat-empty-spec', state: { questId: quest.id } },
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

    it('VALID: {quest with flows via route state} => renders spec panel in right panel', async () => {
      const proxy = QuestChatWidgetProxy();
      const guild = GuildListItemStub({ urlSlug: 'test-guild' });
      const quest = QuestStub({
        id: 'chat-q6',
        status: 'review_flows',
        flows: [FlowStub()],
      });
      const guildDetail = GuildStub({ id: guild.id });

      proxy.setupGuilds({ guilds: [guild] });
      proxy.setupGuild({ guild: guildDetail });

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

    it('VALID: {quest with flows via route state} => spec panel receives quest data', async () => {
      const proxy = QuestChatWidgetProxy();
      const guild = GuildListItemStub({ urlSlug: 'test-guild' });
      const quest = QuestStub({
        id: 'chat-q7',
        status: 'review_flows',
        flows: [FlowStub()],
      });
      const guildDetail = GuildStub({ id: guild.id });

      proxy.setupGuilds({ guilds: [guild] });
      proxy.setupGuild({ guild: guildDetail });

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

    it('VALID: {quest with flows via session list fallback, no route state} => renders spec panel', async () => {
      const proxy = QuestChatWidgetProxy();
      const guild = GuildListItemStub({ urlSlug: 'test-guild' });
      const quest = QuestStub({
        id: 'chat-fallback',
        status: 'review_flows',
        flows: [FlowStub()],
      });
      const guildDetail = GuildStub({ id: guild.id });

      proxy.setupGuilds({ guilds: [guild] });
      proxy.setupGuild({ guild: guildDetail });

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
        status: 'review_flows',
        flows: [FlowStub()],
      });
      const guildDetail = GuildStub({ id: guild.id });

      proxy.setupGuilds({ guilds: [guild] });
      proxy.setupGuild({ guild: guildDetail });

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
    it('VALID: {quest with flows} => spec panel receives externalUpdatePending and onDismissUpdate', async () => {
      const proxy = QuestChatWidgetProxy();
      const guild = GuildListItemStub({ urlSlug: 'test-guild' });
      const quest = QuestStub({
        id: 'chat-q9',
        status: 'review_flows',
        flows: [FlowStub()],
      });
      const guildDetail = GuildStub({ id: guild.id });

      proxy.setupGuilds({ guilds: [guild] });
      proxy.setupGuild({ guild: guildDetail });

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

  describe('approval messages', () => {
    it('VALID: {click APPROVE, status: review_flows} => sends flows approved message', async () => {
      const proxy = QuestChatWidgetProxy();
      const guild = GuildListItemStub({ urlSlug: 'test-guild' });
      const quest = QuestStub({
        id: 'chat-approve-1',
        status: 'review_flows',
        flows: [FlowStub()],
      });
      const guildDetail = GuildStub({ id: guild.id });

      proxy.setupGuilds({ guilds: [guild] });
      proxy.setupGuild({ guild: guildDetail });
      proxy.setupModify();
      proxy.setupChat({ chatProcessId: 'proc-approve-1' as never });

      mantineRenderAdapter({
        ui: (
          <MemoryRouter
            initialEntries={[
              { pathname: '/test-guild/session/chat-approve-1', state: { questId: quest.id } },
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

      await proxy.clickApprove();

      await waitFor(() => {
        expect(
          screen.getByText('Flows approved. Proceed to observables and contracts.'),
        ).toBeInTheDocument();
      });

      expect(
        screen.getByText('Flows approved. Proceed to observables and contracts.'),
      ).toBeInTheDocument();
    });

    it('VALID: {click APPROVE, status: review_observables} => does not send chat message to avoid race condition', async () => {
      const proxy = QuestChatWidgetProxy();
      const guild = GuildListItemStub({ urlSlug: 'test-guild' });
      const quest = QuestStub({
        id: 'chat-approve-2',
        status: 'review_observables',
        flows: [FlowStub()],
      });
      const guildDetail = GuildStub({ id: guild.id });

      proxy.setupGuilds({ guilds: [guild] });
      proxy.setupGuild({ guild: guildDetail });
      proxy.setupModify();
      proxy.setupChat({ chatProcessId: 'proc-approve-2' as never });

      mantineRenderAdapter({
        ui: (
          <MemoryRouter
            initialEntries={[
              { pathname: '/test-guild/session/chat-approve-2', state: { questId: quest.id } },
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

      await proxy.clickApprove();

      expect(
        screen.queryByText('Observables and contracts approved. Spec is fully approved.'),
      ).not.toBeInTheDocument();
    });
  });

  describe('approved modal', () => {
    it('VALID: {quest transitions to approved status} => shows approved modal', async () => {
      const proxy = QuestChatWidgetProxy();
      const guild = GuildListItemStub({ urlSlug: 'test-guild' });
      const quest = QuestStub({
        id: 'chat-modal-1',
        status: 'review_observables',
        flows: [FlowStub()],
      });
      const guildDetail = GuildStub({ id: guild.id });

      proxy.setupGuilds({ guilds: [guild] });
      proxy.setupGuild({ guild: guildDetail });
      proxy.setupModify();

      mantineRenderAdapter({
        ui: (
          <MemoryRouter
            initialEntries={[
              { pathname: '/test-guild/session/chat-modal-1', state: { questId: quest.id } },
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

      expect(proxy.hasApprovedModal()).toBe(false);

      act(() => {
        proxy.setupQuest({
          quest: QuestStub({ id: 'chat-modal-1', status: 'approved', flows: [FlowStub()] }),
        });
      });

      await waitFor(() => {
        expect(proxy.hasApprovedModal()).toBe(true);
      });

      expect(proxy.hasApprovedModal()).toBe(true);
    });

    it('VALID: {quest transitions to design_approved status} => shows approved modal', async () => {
      const proxy = QuestChatWidgetProxy();
      const guild = GuildListItemStub({ urlSlug: 'test-guild' });
      const quest = QuestStub({
        id: 'chat-modal-2',
        status: 'review_design',
        flows: [FlowStub()],
      });
      const guildDetail = GuildStub({ id: guild.id });

      proxy.setupGuilds({ guilds: [guild] });
      proxy.setupGuild({ guild: guildDetail });
      proxy.setupModify();

      mantineRenderAdapter({
        ui: (
          <MemoryRouter
            initialEntries={[
              { pathname: '/test-guild/session/chat-modal-2', state: { questId: quest.id } },
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

      expect(proxy.hasApprovedModal()).toBe(false);

      act(() => {
        proxy.setupQuest({
          quest: QuestStub({ id: 'chat-modal-2', status: 'design_approved', flows: [FlowStub()] }),
        });
      });

      await waitFor(() => {
        expect(proxy.hasApprovedModal()).toBe(true);
      });

      expect(proxy.hasApprovedModal()).toBe(true);
    });

    it('VALID: {quest stays at non-approved status} => does not show approved modal', async () => {
      const proxy = QuestChatWidgetProxy();
      const guild = GuildListItemStub({ urlSlug: 'test-guild' });
      const quest = QuestStub({
        id: 'chat-modal-3',
        status: 'review_flows',
        flows: [FlowStub()],
      });
      const guildDetail = GuildStub({ id: guild.id });

      proxy.setupGuilds({ guilds: [guild] });
      proxy.setupGuild({ guild: guildDetail });

      mantineRenderAdapter({
        ui: (
          <MemoryRouter
            initialEntries={[
              { pathname: '/test-guild/session/chat-modal-3', state: { questId: quest.id } },
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

      expect(proxy.hasApprovedModal()).toBe(false);
    });

    it('VALID: {click Begin Quest on approved modal} => calls quest start broker', async () => {
      const proxy = QuestChatWidgetProxy();
      const guild = GuildListItemStub({ urlSlug: 'test-guild' });
      const quest = QuestStub({
        id: 'chat-modal-4',
        status: 'review_observables',
        flows: [FlowStub()],
      });
      const guildDetail = GuildStub({ id: guild.id });

      proxy.setupGuilds({ guilds: [guild] });
      proxy.setupGuild({ guild: guildDetail });
      proxy.setupModify();
      proxy.setupQuestStart({ processId: 'proc-modal-4' });

      mantineRenderAdapter({
        ui: (
          <MemoryRouter
            initialEntries={[
              { pathname: '/test-guild/session/chat-modal-4', state: { questId: quest.id } },
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

      act(() => {
        proxy.setupQuest({
          quest: QuestStub({ id: 'chat-modal-4', status: 'approved', flows: [FlowStub()] }),
        });
      });

      await waitFor(() => {
        expect(proxy.hasApprovedModal()).toBe(true);
      });

      await proxy.clickApprovedModalBeginQuest();

      await waitFor(() => {
        expect(proxy.hasApprovedModal()).toBe(false);
      });

      expect(proxy.hasApprovedModal()).toBe(false);
    });

    it('VALID: {click Keep Chatting on approved modal, status approved} => closes modal', async () => {
      const proxy = QuestChatWidgetProxy();
      const guild = GuildListItemStub({ urlSlug: 'test-guild' });
      const quest = QuestStub({
        id: 'chat-modal-5',
        status: 'review_observables',
        flows: [FlowStub()],
      });
      const guildDetail = GuildStub({ id: guild.id });

      proxy.setupGuilds({ guilds: [guild] });
      proxy.setupGuild({ guild: guildDetail });
      proxy.setupModify();

      mantineRenderAdapter({
        ui: (
          <MemoryRouter
            initialEntries={[
              { pathname: '/test-guild/session/chat-modal-5', state: { questId: quest.id } },
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

      act(() => {
        proxy.setupQuest({
          quest: QuestStub({ id: 'chat-modal-5', status: 'approved', flows: [FlowStub()] }),
        });
      });

      await waitFor(() => {
        expect(proxy.hasApprovedModal()).toBe(true);
      });

      await proxy.clickApprovedModalKeepChatting();

      await waitFor(() => {
        expect(proxy.hasApprovedModal()).toBe(false);
      });

      expect(proxy.hasApprovedModal()).toBe(false);
    });

    it('VALID: {click Start a new Quest on approved modal} => closes modal', async () => {
      const proxy = QuestChatWidgetProxy();
      const guild = GuildListItemStub({ urlSlug: 'test-guild' });
      const quest = QuestStub({
        id: 'chat-modal-6',
        status: 'review_observables',
        flows: [FlowStub()],
      });
      const guildDetail = GuildStub({ id: guild.id });

      proxy.setupGuilds({ guilds: [guild] });
      proxy.setupGuild({ guild: guildDetail });
      proxy.setupModify();

      mantineRenderAdapter({
        ui: (
          <MemoryRouter
            initialEntries={[
              { pathname: '/test-guild/session/chat-modal-6', state: { questId: quest.id } },
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

      act(() => {
        proxy.setupQuest({
          quest: QuestStub({ id: 'chat-modal-6', status: 'approved', flows: [FlowStub()] }),
        });
      });

      await waitFor(() => {
        expect(proxy.hasApprovedModal()).toBe(true);
      });

      await proxy.clickApprovedModalNewQuest();

      await waitFor(() => {
        expect(proxy.hasApprovedModal()).toBe(false);
      });

      expect(proxy.hasApprovedModal()).toBe(false);
    });

    it('EMPTY: {no quest data} => does not render approved modal', () => {
      const proxy = QuestChatWidgetProxy();
      const guild = GuildListItemStub({ urlSlug: 'test-guild' });
      const guildDetail = GuildStub({ id: guild.id });

      proxy.setupGuilds({ guilds: [guild] });
      proxy.setupGuild({ guild: guildDetail });

      mantineRenderAdapter({
        ui: (
          <MemoryRouter initialEntries={['/test-guild/session/chat-modal-7']}>
            <Routes>
              <Route path="/:guildSlug/session/:sessionId" element={<QuestChatWidget />} />
            </Routes>
          </MemoryRouter>
        ),
      });

      expect(proxy.hasApprovedModal()).toBe(false);
    });
  });

  describe('guild-level chat', () => {
    it('VALID: {guildSlug without sessionId} => renders ChatPanelWidget', () => {
      const proxy = QuestChatWidgetProxy();
      const guild = GuildListItemStub({ urlSlug: 'my-guild' });
      const guildDetail = GuildStub({ id: guild.id });

      proxy.setupGuilds({ guilds: [guild] });
      proxy.setupGuild({ guild: guildDetail });

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

  describe('pipeline restart after blocked', () => {
    it('VALID: {quest transitions from in_progress to blocked to in_progress} => calls questStartBroker again on resume', async () => {
      const proxy = QuestChatWidgetProxy();
      const guild = GuildListItemStub({ urlSlug: 'test-guild' });
      const quest = QuestStub({
        id: 'chat-resume-1',
        status: 'in_progress',
      });
      const guildDetail = GuildStub({ id: guild.id });

      proxy.setupGuilds({ guilds: [guild] });
      proxy.setupGuild({ guild: guildDetail });
      proxy.setupQuestStart({ processId: 'proc-resume-1' });

      mantineRenderAdapter({
        ui: (
          <MemoryRouter
            initialEntries={[
              { pathname: '/test-guild/session/chat-resume-1', state: { questId: quest.id } },
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
        expect(proxy.hasExecutionPanel()).toBe(true);
      });

      await waitFor(() => {
        expect(proxy.getQuestStartRequestCount()).toBe(1);
      });

      act(() => {
        proxy.setupQuest({
          quest: QuestStub({ id: 'chat-resume-1', status: 'blocked' }),
        });
      });

      act(() => {
        proxy.setupQuest({
          quest: QuestStub({ id: 'chat-resume-1', status: 'in_progress' }),
        });
      });

      await waitFor(() => {
        expect(proxy.getQuestStartRequestCount()).toBe(2);
      });

      expect(proxy.getQuestStartRequestCount()).toBe(2);
    });
  });

  describe('execution phase layout', () => {
    it('VALID: {quest with in_progress status} => renders execution panel in left and dumpster raccoon in right', async () => {
      const proxy = QuestChatWidgetProxy();
      const guild = GuildListItemStub({ urlSlug: 'test-guild' });
      const quest = QuestStub({
        id: 'chat-exec-1',
        status: 'in_progress',
      });
      const guildDetail = GuildStub({ id: guild.id });

      proxy.setupGuilds({ guilds: [guild] });
      proxy.setupGuild({ guild: guildDetail });

      mantineRenderAdapter({
        ui: (
          <MemoryRouter
            initialEntries={[
              { pathname: '/test-guild/session/chat-exec-1', state: { questId: quest.id } },
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
        expect(proxy.hasExecutionPanel()).toBe(true);
      });

      expect(proxy.hasDumpsterRaccoon()).toBe(true);
      expect(proxy.hasChatPanel()).toBe(false);
      expect(proxy.hasSpecPanel()).toBe(false);
    });

    it('VALID: {quest with in_progress status, chat-output WS message with slotIndex} => renders execution messages in planning row', async () => {
      const proxy = QuestChatWidgetProxy();
      const guild = GuildListItemStub({ urlSlug: 'test-guild' });
      const quest = QuestStub({
        id: 'chat-exec-ws',
        status: 'in_progress',
      });
      const guildDetail = GuildStub({ id: guild.id });

      proxy.setupGuilds({ guilds: [guild] });
      proxy.setupGuild({ guild: guildDetail });

      mantineRenderAdapter({
        ui: (
          <MemoryRouter
            initialEntries={[
              { pathname: '/test-guild/session/chat-exec-ws', state: { questId: quest.id } },
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
        expect(proxy.hasExecutionPanel()).toBe(true);
      });

      act(() => {
        proxy.receiveWsMessage({
          data: JSON.stringify({
            type: 'chat-output',
            payload: {
              slotIndex: 0,
              entry: {
                raw: JSON.stringify({
                  type: 'assistant',
                  message: {
                    role: 'assistant',
                    content: [{ type: 'text', text: 'Building auth guard...' }],
                  },
                }),
              },
            },
            timestamp: '2025-01-01T00:00:00.000Z',
          }),
        });
      });

      await waitFor(() => {
        expect(screen.queryAllByTestId('CHAT_MESSAGE').length).toBeGreaterThan(0);
      });

      expect(screen.queryAllByTestId('CHAT_MESSAGE').length).toBeGreaterThan(0);
    });

    it('VALID: {quest with non-execution status} => renders chat panel and spec panel', async () => {
      const proxy = QuestChatWidgetProxy();
      const guild = GuildListItemStub({ urlSlug: 'test-guild' });
      const quest = QuestStub({
        id: 'chat-noexec-1',
        status: 'review_flows',
        flows: [FlowStub()],
      });
      const guildDetail = GuildStub({ id: guild.id });

      proxy.setupGuilds({ guilds: [guild] });
      proxy.setupGuild({ guild: guildDetail });

      mantineRenderAdapter({
        ui: (
          <MemoryRouter
            initialEntries={[
              { pathname: '/test-guild/session/chat-noexec-1', state: { questId: quest.id } },
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

      expect(proxy.hasChatPanel()).toBe(true);
      expect(proxy.hasExecutionPanel()).toBe(false);
      expect(proxy.hasDumpsterRaccoon()).toBe(false);
    });
  });

  describe('live sessionId routing in execution phase', () => {
    it('VALID: {chat-output WS message with slotIndex and sessionId} => routes entries to work item panel by sessionId', async () => {
      const proxy = QuestChatWidgetProxy();
      const guild = GuildListItemStub({ urlSlug: 'test-guild' });
      const quest = QuestStub({
        id: 'chat-live-session',
        status: 'complete',
        steps: [],
        workItems: [
          WorkItemStub({
            id: 'a0000000-0000-0000-0000-000000000001',
            role: 'chaoswhisperer',
            status: 'complete',
            sessionId: 'chat-live-session' as never,
          }),
          WorkItemStub({
            id: 'a0000000-0000-0000-0000-000000000002',
            role: 'codeweaver',
            status: 'complete',
            sessionId: 'wi-live-session-cw' as never,
          }),
        ],
      });
      const guildDetail = GuildStub({ id: guild.id });

      proxy.setupGuilds({ guilds: [guild] });
      proxy.setupGuild({ guild: guildDetail });
      proxy.setupQuestStart({ processId: 'proc-live-session' });

      mantineRenderAdapter({
        ui: (
          <MemoryRouter
            initialEntries={[
              {
                pathname: '/test-guild/session/chat-live-session',
                state: { questId: quest.id },
              },
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
        expect(proxy.hasExecutionPanel()).toBe(true);
      });

      act(() => {
        proxy.receiveWsMessage({
          data: JSON.stringify({
            type: 'chat-output',
            payload: {
              slotIndex: 0,
              sessionId: 'wi-live-session-cw',
              entry: {
                raw: JSON.stringify({
                  type: 'assistant',
                  message: {
                    role: 'assistant',
                    content: [{ type: 'text', text: 'Live codeweaver output...' }],
                  },
                }),
              },
            },
            timestamp: '2025-01-01T00:00:00.000Z',
          }),
        });
      });

      const stepRows = screen.queryAllByTestId('execution-row-layer-widget');
      const codeweaverRow = stepRows.find((row) => row.textContent?.includes('CODEWEAVER'));
      const rowHeader = codeweaverRow!.querySelector('[data-testid="execution-row-header"]')!;

      await userEvent.click(rowHeader);

      const messages = codeweaverRow!.querySelectorAll('[data-testid="CHAT_MESSAGE"]');

      expect(Array.from(messages).map((m) => m.getAttribute('data-testid'))).toStrictEqual([
        'CHAT_MESSAGE',
      ]);
      expect(messages[0]?.textContent).toMatch(/Live codeweaver output/u);
    });

    it('VALID: {two codeweaver instances, live message for first sessionId} => routes to first instance only', async () => {
      const proxy = QuestChatWidgetProxy();
      const guild = GuildListItemStub({ urlSlug: 'test-guild' });
      const quest = QuestStub({
        id: 'chat-multi-inst-1',
        status: 'complete',
        steps: [],
        workItems: [
          WorkItemStub({
            id: 'a0000000-0000-0000-0000-000000000001',
            role: 'chaoswhisperer',
            status: 'complete',
            sessionId: 'chat-multi-inst-1' as never,
          }),
          WorkItemStub({
            id: 'a0000000-0000-0000-0000-000000000010',
            role: 'codeweaver',
            status: 'complete',
            sessionId: 'wi-cw-session-1' as never,
          }),
          WorkItemStub({
            id: 'a0000000-0000-0000-0000-000000000011',
            role: 'codeweaver',
            status: 'complete',
            sessionId: 'wi-cw-session-2' as never,
          }),
        ],
      });
      const guildDetail = GuildStub({ id: guild.id });

      proxy.setupGuilds({ guilds: [guild] });
      proxy.setupGuild({ guild: guildDetail });
      proxy.setupQuestStart({ processId: 'proc-multi-inst-1' });

      mantineRenderAdapter({
        ui: (
          <MemoryRouter
            initialEntries={[
              {
                pathname: '/test-guild/session/chat-multi-inst-1',
                state: { questId: quest.id },
              },
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
        expect(proxy.hasExecutionPanel()).toBe(true);
      });

      act(() => {
        proxy.receiveWsMessage({
          data: JSON.stringify({
            type: 'chat-output',
            payload: {
              slotIndex: 0,
              sessionId: 'wi-cw-session-1',
              entry: {
                raw: JSON.stringify({
                  type: 'assistant',
                  message: {
                    role: 'assistant',
                    content: [{ type: 'text', text: 'Codeweaver instance one working...' }],
                  },
                }),
              },
            },
            timestamp: '2025-01-01T00:00:00.000Z',
          }),
        });
      });

      const stepRows = screen.queryAllByTestId('execution-row-layer-widget');
      const codeweaverRows = stepRows.filter((row) => row.textContent?.includes('CODEWEAVER'));
      const [firstRow] = codeweaverRows;
      const firstHeader = firstRow!.querySelector('[data-testid="execution-row-header"]')!;

      await userEvent.click(firstHeader);

      const firstRowMessages = firstRow!.querySelectorAll('[data-testid="CHAT_MESSAGE"]');

      expect(Array.from(firstRowMessages).map((m) => m.getAttribute('data-testid'))).toStrictEqual([
        'CHAT_MESSAGE',
      ]);
      expect(firstRowMessages[0]?.textContent).toMatch(/Codeweaver instance one working/u);
    });

    it('VALID: {two codeweaver instances, live message for second sessionId} => routes to second instance only', async () => {
      const proxy = QuestChatWidgetProxy();
      const guild = GuildListItemStub({ urlSlug: 'test-guild' });
      const quest = QuestStub({
        id: 'chat-multi-inst-2',
        status: 'complete',
        steps: [],
        workItems: [
          WorkItemStub({
            id: 'a0000000-0000-0000-0000-000000000001',
            role: 'chaoswhisperer',
            status: 'complete',
            sessionId: 'chat-multi-inst-2' as never,
          }),
          WorkItemStub({
            id: 'a0000000-0000-0000-0000-000000000010',
            role: 'codeweaver',
            status: 'complete',
            sessionId: 'wi-cw-session-1' as never,
          }),
          WorkItemStub({
            id: 'a0000000-0000-0000-0000-000000000011',
            role: 'codeweaver',
            status: 'complete',
            sessionId: 'wi-cw-session-2' as never,
          }),
        ],
      });
      const guildDetail = GuildStub({ id: guild.id });

      proxy.setupGuilds({ guilds: [guild] });
      proxy.setupGuild({ guild: guildDetail });
      proxy.setupQuestStart({ processId: 'proc-multi-inst-2' });

      mantineRenderAdapter({
        ui: (
          <MemoryRouter
            initialEntries={[
              {
                pathname: '/test-guild/session/chat-multi-inst-2',
                state: { questId: quest.id },
              },
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
        expect(proxy.hasExecutionPanel()).toBe(true);
      });

      act(() => {
        proxy.receiveWsMessage({
          data: JSON.stringify({
            type: 'chat-output',
            payload: {
              slotIndex: 1,
              sessionId: 'wi-cw-session-2',
              entry: {
                raw: JSON.stringify({
                  type: 'assistant',
                  message: {
                    role: 'assistant',
                    content: [{ type: 'text', text: 'Codeweaver instance two working...' }],
                  },
                }),
              },
            },
            timestamp: '2025-01-01T00:00:00.000Z',
          }),
        });
      });

      const stepRows = screen.queryAllByTestId('execution-row-layer-widget');
      const codeweaverRows = stepRows.filter((row) => row.textContent?.includes('CODEWEAVER'));
      const [, secondRow] = codeweaverRows;
      const secondHeader = secondRow!.querySelector('[data-testid="execution-row-header"]')!;

      await userEvent.click(secondHeader);

      const secondRowMessages = secondRow!.querySelectorAll('[data-testid="CHAT_MESSAGE"]');

      expect(Array.from(secondRowMessages).map((m) => m.getAttribute('data-testid'))).toStrictEqual(
        ['CHAT_MESSAGE'],
      );
      expect(secondRowMessages[0]?.textContent).toMatch(/Codeweaver instance two working/u);
    });
  });

  describe('plain-text fallback for non-JSON lines', () => {
    it('VALID: {chat-output with non-JSON raw line} => falls back to plain text entry without crashing', async () => {
      const proxy = QuestChatWidgetProxy();
      const guild = GuildListItemStub({ urlSlug: 'test-guild' });
      const quest = QuestStub({
        id: 'chat-plaintext-1',
        status: 'in_progress',
      });
      const guildDetail = GuildStub({ id: guild.id });

      proxy.setupGuilds({ guilds: [guild] });
      proxy.setupGuild({ guild: guildDetail });
      proxy.setupQuestStart({ processId: 'proc-plaintext-1' });

      mantineRenderAdapter({
        ui: (
          <MemoryRouter
            initialEntries={[
              {
                pathname: '/test-guild/session/chat-plaintext-1',
                state: { questId: quest.id },
              },
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
        expect(proxy.hasExecutionPanel()).toBe(true);
      });

      act(() => {
        proxy.receiveWsMessage({
          data: JSON.stringify({
            type: 'chat-output',
            payload: {
              slotIndex: 0,
              sessionId: 'chat-plaintext-1',
              entry: {
                raw: 'This is plain text, not JSON',
              },
            },
            timestamp: '2025-01-01T00:00:00.000Z',
          }),
        });
      });

      await waitFor(() => {
        expect(screen.queryAllByTestId('CHAT_MESSAGE').length).toBeGreaterThan(0);
      });

      expect(screen.queryAllByTestId('CHAT_MESSAGE').length).toBeGreaterThan(0);
    });
  });

  describe('ward session replay skip', () => {
    it('VALID: {work item with ward- prefixed sessionId, replay response for ward session} => does not render ward replay entries', async () => {
      const proxy = QuestChatWidgetProxy();
      const guild = GuildListItemStub({ urlSlug: 'test-guild' });
      const quest = QuestStub({
        id: 'chat-ward-skip',
        status: 'complete',
        steps: [],
        workItems: [
          WorkItemStub({
            id: 'a0000000-0000-0000-0000-000000000001',
            role: 'chaoswhisperer',
            status: 'complete',
            sessionId: 'chat-ward-skip' as never,
          }),
          WorkItemStub({
            id: 'a0000000-0000-0000-0000-000000000002',
            role: 'codeweaver',
            status: 'complete',
            sessionId: 'wi-normal-session' as never,
          }),
          WorkItemStub({
            id: 'a0000000-0000-0000-0000-000000000003',
            role: 'ward',
            status: 'complete',
            sessionId: 'ward-session-abc' as never,
          }),
        ],
      });
      const guildDetail = GuildStub({ id: guild.id });

      proxy.setupGuilds({ guilds: [guild] });
      proxy.setupGuild({ guild: guildDetail });
      proxy.setupQuestStart({ processId: 'proc-ward-skip' });

      mantineRenderAdapter({
        ui: (
          <MemoryRouter
            initialEntries={[
              {
                pathname: '/test-guild/session/chat-ward-skip',
                state: { questId: quest.id },
              },
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
        expect(proxy.hasExecutionPanel()).toBe(true);
      });

      act(() => {
        proxy.receiveWsMessage({
          data: JSON.stringify({
            type: 'chat-output',
            payload: {
              chatProcessId: 'replay-wi-normal-session',
              line: JSON.stringify({
                type: 'assistant',
                message: {
                  role: 'assistant',
                  content: [{ type: 'text', text: 'Normal codeweaver output...' }],
                },
              }),
            },
            timestamp: '2025-01-01T00:00:00.000Z',
          }),
        });
      });

      const stepRows = screen.queryAllByTestId('execution-row-layer-widget');
      const codeweaverRow = stepRows.find((row) => row.textContent?.includes('CODEWEAVER'));
      const codeweaverHeader = codeweaverRow!.querySelector(
        '[data-testid="execution-row-header"]',
      )!;

      await userEvent.click(codeweaverHeader);

      const codeweaverMessages = codeweaverRow!.querySelectorAll('[data-testid="CHAT_MESSAGE"]');

      expect(
        Array.from(codeweaverMessages).map((m) => m.getAttribute('data-testid')),
      ).toStrictEqual(['CHAT_MESSAGE']);
      expect(codeweaverMessages[0]?.textContent).toMatch(/Normal codeweaver output/u);

      const wardRow = stepRows.find((row) => row.textContent?.includes('WARD'));
      const wardHeader = wardRow!.querySelector('[data-testid="execution-row-header"]')!;

      await userEvent.click(wardHeader);

      const wardMessages = wardRow!.querySelectorAll('[data-testid="CHAT_MESSAGE"]');

      expect(Array.from(wardMessages)).toStrictEqual([]);
    });
  });

  describe('error logging in catch handlers', () => {
    it('ERROR: {questStartBroker rejects in execution phase} => logs error to console.error', async () => {
      const proxy = QuestChatWidgetProxy();
      const guild = GuildListItemStub({ urlSlug: 'test-guild' });
      const quest = QuestStub({
        id: 'chat-err-start',
        status: 'in_progress',
      });
      const guildDetail = GuildStub({ id: guild.id });
      const consoleErrorSpy = proxy.setupConsoleErrorCapture();

      proxy.setupGuilds({ guilds: [guild] });
      proxy.setupGuild({ guild: guildDetail });
      proxy.setupQuestStartError();

      mantineRenderAdapter({
        ui: (
          <MemoryRouter
            initialEntries={[
              {
                pathname: '/test-guild/session/chat-err-start',
                state: { questId: quest.id },
              },
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
        expect(proxy.hasExecutionPanel()).toBe(true);
      });

      await waitFor(() => {
        expect(consoleErrorSpy).toHaveBeenCalledWith(
          '[quest-chat] quest-start failed',
          expect.anything(),
        );
      });

      expect(consoleErrorSpy).toHaveBeenCalledWith(
        '[quest-chat] quest-start failed',
        expect.anything(),
      );
    });

    it('ERROR: {questModifyBroker rejects via keep chatting} => logs error to console.error', async () => {
      const proxy = QuestChatWidgetProxy();
      const guild = GuildListItemStub({ urlSlug: 'test-guild' });
      const quest = QuestStub({
        id: 'chat-err-modify',
        status: 'review_observables',
        flows: [FlowStub()],
      });
      const guildDetail = GuildStub({ id: guild.id });
      const consoleErrorSpy = proxy.setupConsoleErrorCapture();

      proxy.setupGuilds({ guilds: [guild] });
      proxy.setupGuild({ guild: guildDetail });
      proxy.setupQuestModifyError();

      mantineRenderAdapter({
        ui: (
          <MemoryRouter
            initialEntries={[
              {
                pathname: '/test-guild/session/chat-err-modify',
                state: { questId: quest.id },
              },
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

      act(() => {
        proxy.setupQuest({
          quest: QuestStub({
            id: 'chat-err-modify',
            status: 'approved',
            flows: [FlowStub()],
          }),
        });
      });

      await waitFor(() => {
        expect(proxy.hasApprovedModal()).toBe(true);
      });

      await proxy.clickApprovedModalKeepChatting();

      await waitFor(() => {
        expect(consoleErrorSpy).toHaveBeenCalledWith('[keep-chatting]', expect.anything());
      });

      expect(consoleErrorSpy).toHaveBeenCalledWith('[keep-chatting]', expect.anything());
    });

    it('ERROR: {questStartBroker rejects via begin quest} => logs error to console.error', async () => {
      const proxy = QuestChatWidgetProxy();
      const guild = GuildListItemStub({ urlSlug: 'test-guild' });
      const quest = QuestStub({
        id: 'chat-err-begin',
        status: 'review_observables',
        flows: [FlowStub()],
      });
      const guildDetail = GuildStub({ id: guild.id });
      const consoleErrorSpy = proxy.setupConsoleErrorCapture();

      proxy.setupGuilds({ guilds: [guild] });
      proxy.setupGuild({ guild: guildDetail });
      proxy.setupQuestStartError();

      mantineRenderAdapter({
        ui: (
          <MemoryRouter
            initialEntries={[
              {
                pathname: '/test-guild/session/chat-err-begin',
                state: { questId: quest.id },
              },
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

      act(() => {
        proxy.setupQuest({
          quest: QuestStub({
            id: 'chat-err-begin',
            status: 'approved',
            flows: [FlowStub()],
          }),
        });
      });

      await waitFor(() => {
        expect(proxy.hasApprovedModal()).toBe(true);
      });

      await proxy.clickApprovedModalBeginQuest();

      await waitFor(() => {
        expect(consoleErrorSpy).toHaveBeenCalledWith('[begin-quest]', expect.anything());
      });

      expect(consoleErrorSpy).toHaveBeenCalledWith('[begin-quest]', expect.anything());
    });
  });

  describe('work item session entries in execution phase', () => {
    it('VALID: {quest in execution phase with replay response for work item session} => shows entries in execution panel', async () => {
      const proxy = QuestChatWidgetProxy();
      const guild = GuildListItemStub({ urlSlug: 'test-guild' });
      const quest = QuestStub({
        id: 'chat-replay-entries',
        status: 'complete',
        steps: [],
        workItems: [
          WorkItemStub({
            id: 'a0000000-0000-0000-0000-000000000001',
            role: 'chaoswhisperer',
            status: 'complete',
            sessionId: 'chat-replay-entries' as never,
          }),
          WorkItemStub({
            id: 'a0000000-0000-0000-0000-000000000002',
            role: 'pathseeker',
            status: 'complete',
            sessionId: 'wi-session-bbb' as never,
          }),
        ],
      });
      const guildDetail = GuildStub({ id: guild.id });

      proxy.setupGuilds({ guilds: [guild] });
      proxy.setupGuild({ guild: guildDetail });
      proxy.setupQuestStart({ processId: 'proc-replay-entries' });

      mantineRenderAdapter({
        ui: (
          <MemoryRouter
            initialEntries={[
              {
                pathname: '/test-guild/session/chat-replay-entries',
                state: { questId: quest.id },
              },
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
        expect(proxy.hasExecutionPanel()).toBe(true);
      });

      act(() => {
        proxy.receiveWsMessage({
          data: JSON.stringify({
            type: 'chat-output',
            payload: {
              chatProcessId: 'replay-wi-session-bbb',
              line: JSON.stringify({
                type: 'assistant',
                message: {
                  role: 'assistant',
                  content: [{ type: 'text', text: 'Exploring quest requirements...' }],
                },
              }),
            },
            timestamp: '2025-01-01T00:00:00.000Z',
          }),
        });
      });

      const stepRows = screen.queryAllByTestId('execution-row-layer-widget');
      const pathseekerRow = stepRows.find((row) => row.textContent?.includes('PATHSEEKER'));
      const rowHeader = pathseekerRow!.querySelector('[data-testid="execution-row-header"]')!;

      await userEvent.click(rowHeader);

      const messages = screen.queryAllByTestId('CHAT_MESSAGE');

      expect(messages.map((m) => m.getAttribute('data-testid'))).toStrictEqual(['CHAT_MESSAGE']);
      expect(messages[0]?.textContent).toMatch(/Exploring quest requirements/u);
    });
  });

  describe('execution phase WS replay race condition', () => {
    it('VALID: {WS not yet open when quest data arrives} => replay-history deferred until WS opens', async () => {
      const proxy = QuestChatWidgetProxy({ deferOpen: true });
      const guild = GuildListItemStub({ urlSlug: 'test-guild' });
      const quest = QuestStub({
        id: 'chat-race-1',
        status: 'in_progress',
        steps: [],
        workItems: [
          WorkItemStub({
            id: 'a0000000-0000-0000-0000-000000000010',
            role: 'chaoswhisperer',
            status: 'complete',
            sessionId: 'chat-race-1' as never,
          }),
          WorkItemStub({
            id: 'a0000000-0000-0000-0000-000000000011',
            role: 'pathseeker',
            status: 'in_progress',
            sessionId: 'ps-session-race' as never,
          }),
        ],
      });
      const guildDetail = GuildStub({ id: guild.id });

      proxy.setupGuilds({ guilds: [guild] });
      proxy.setupGuild({ guild: guildDetail });
      proxy.setupQuestStart({ processId: 'proc-race-1' });

      mantineRenderAdapter({
        ui: (
          <MemoryRouter
            initialEntries={[
              {
                pathname: '/test-guild/session/chat-race-1',
                state: { questId: quest.id },
              },
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
        expect(proxy.hasExecutionPanel()).toBe(true);
      });

      expect(proxy.getSentWsMessages()).toStrictEqual([]);

      act(() => {
        proxy.triggerWsOpen();
      });

      await waitFor(() => {
        const sent = proxy.getSentWsMessages();

        expect(sent.length).toBeGreaterThan(0);
      });

      const sent = proxy.getSentWsMessages();
      const replaySessionIds = sent
        .filter((msg) => Reflect.get(msg as object, 'type') === 'replay-history')
        .map((msg) => Reflect.get(msg as object, 'sessionId'));

      expect(replaySessionIds).toStrictEqual(['chat-race-1', 'chat-race-1', 'ps-session-race']);
    });
  });
});
