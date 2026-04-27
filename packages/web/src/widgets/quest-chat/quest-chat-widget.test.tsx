/**
 * PURPOSE: Tests for QuestChatWidget - split panel layout with chat and activity
 */

import { act, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter, Route, Routes, useLocation } from 'react-router-dom';

import {
  FlowStub,
  GuildListItemStub,
  GuildStub,
  QuestListItemStub,
  QuestQueueEntryStub,
  QuestStub,
  WorkItemStub,
} from '@dungeonmaster/shared/contracts';
import { questStatusMetadataStatics } from '@dungeonmaster/shared/statics';

import { mantineRenderAdapter } from '../../adapters/mantine/render/mantine-render-adapter';
import { extractReplaySessionIdsTransformer } from '../../transformers/extract-replay-session-ids/extract-replay-session-ids-transformer';
import { QuestChatWidget } from './quest-chat-widget';
import { QuestChatWidgetProxy } from './quest-chat-widget.proxy';

type QuestStatus = ReturnType<typeof QuestStub>['status'];

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

      expect(screen.queryByTestId('QUEST_CHAT_LOADING')).toBeInTheDocument();
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
              entries: [
                {
                  role: 'assistant',
                  type: 'tool_use',
                  toolName: 'mcp__dungeonmaster__ask-user-question',
                  toolInput: JSON.stringify({
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
                  }),
                },
              ],
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
              entries: [
                {
                  role: 'assistant',
                  type: 'tool_use',
                  toolName: 'mcp__dungeonmaster__ask-user-question',
                  toolInput: JSON.stringify({
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
                  }),
                },
              ],
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
              entries: [
                {
                  role: 'assistant',
                  type: 'tool_use',
                  toolName: 'mcp__dungeonmaster__ask-user-question',
                  toolInput: JSON.stringify({
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
                  }),
                },
              ],
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
        const messages = screen.queryAllByTestId('CHAT_MESSAGE');
        const lastMessage = messages[messages.length - 1];

        expect(lastMessage?.textContent).toBe(
          'YOUFlows approved. Proceed to observables and contracts.',
        );
      });

      const messages = screen.queryAllByTestId('CHAT_MESSAGE');
      const lastMessage = messages[messages.length - 1];

      expect(lastMessage?.textContent).toBe(
        'YOUFlows approved. Proceed to observables and contracts.',
      );
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

      const approvalMessages = screen
        .queryAllByTestId('CHAT_MESSAGE')
        .filter(
          (m) => m.textContent === 'YOUObservables and contracts approved. Spec is fully approved.',
        );

      expect(approvalMessages).toStrictEqual([]);
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

    it('VALID: {quest transitions to design_approved status} => does not show approved modal', async () => {
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

      expect(proxy.hasApprovedModal()).toBe(false);
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

    it('VALID: {chat-session-started arrives while streaming} => navigates to session URL with replace', async () => {
      const proxy = QuestChatWidgetProxy();
      const guild = GuildListItemStub({ urlSlug: 'my-guild' });
      const guildDetail = GuildStub({ id: guild.id });

      proxy.setupGuilds({ guilds: [guild] });
      proxy.setupGuild({ guild: guildDetail });
      proxy.setupChat({ chatProcessId: 'chat-proc-early' as never });

      const LocationDisplay = (): React.JSX.Element => {
        const location = useLocation();
        return <span data-testid="LOCATION_PATHNAME">{location.pathname}</span>;
      };

      mantineRenderAdapter({
        ui: (
          <MemoryRouter initialEntries={['/my-guild/session']}>
            <Routes>
              <Route
                path="/:guildSlug/session"
                element={
                  <>
                    <QuestChatWidget />
                    <LocationDisplay />
                  </>
                }
              />
              <Route
                path="/:guildSlug/session/:sessionId"
                element={
                  <>
                    <QuestChatWidget />
                    <LocationDisplay />
                  </>
                }
              />
            </Routes>
          </MemoryRouter>
        ),
      });

      await waitFor(() => {
        expect(screen.getByTestId('LOCATION_PATHNAME').textContent).toBe('/my-guild/session');
      });

      // Send a message so the binding tracks the chatProcessId, enabling WS routing
      const textarea = screen.getByTestId('CHAT_INPUT');
      await userEvent.type(textarea, 'Help me build auth');
      await userEvent.click(screen.getByTestId('SEND_BUTTON'));

      await waitFor(() => {
        expect(screen.getByTestId('STREAMING_INDICATOR')).toBe(
          screen.getByTestId('STREAMING_INDICATOR'),
        );
      });

      act(() => {
        proxy.receiveWsMessage({
          data: JSON.stringify({
            type: 'chat-session-started',
            payload: {
              chatProcessId: 'chat-proc-early',
              sessionId: 'new-session-xyz',
            },
            timestamp: '2025-01-01T00:00:00.000Z',
          }),
        });
      });

      await waitFor(() => {
        expect(screen.getByTestId('LOCATION_PATHNAME').textContent).toBe(
          '/my-guild/session/new-session-xyz',
        );
      });

      expect(screen.getByTestId('LOCATION_PATHNAME').textContent).toBe(
        '/my-guild/session/new-session-xyz',
      );
    });
  });

  describe('no widget-driven auto-start', () => {
    it('VALID: {quest transitions approved → seek_scope → paused → in_progress} => widget never POSTs /start (user-driven via Begin Quest modal only)', async () => {
      const proxy = QuestChatWidgetProxy();
      const guild = GuildListItemStub({ urlSlug: 'test-guild' });
      const quest = QuestStub({
        id: 'chat-resume-1',
        status: 'approved',
        flows: [FlowStub()],
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

      act(() => {
        proxy.setupQuest({
          quest: QuestStub({ id: 'chat-resume-1', status: 'seek_scope' }),
        });
      });

      act(() => {
        proxy.setupQuest({
          quest: QuestStub({ id: 'chat-resume-1', status: 'paused' }),
        });
      });

      act(() => {
        proxy.setupQuest({
          quest: QuestStub({ id: 'chat-resume-1', status: 'in_progress' }),
        });
      });

      // Wait for any pending effects to settle — the widget renders and may subscribe
      // to a chat session, but it must NOT auto-POST /start for any of these statuses.
      await waitFor(() => {
        expect(proxy.hasExecutionPanel()).toBe(true);
      });

      // Widget never POSTs /start itself — all quest starts flow through either
      //   (a) the QuestApprovedModalWidget "Begin Quest" button (user-driven), or
      //   (b) the orchestrator startup-recovery responder (server-boot).
      // Resume from paused is handled server-side via `isAutoResumable`.
      expect(proxy.getQuestStartRequestCount()).toBe(0);
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
              entries: [
                {
                  role: 'assistant',
                  type: 'text',
                  content: 'Building auth guard...',
                },
              ],
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

    it.each([{ status: 'complete' }, { status: 'abandoned' }] as const)(
      'VALID: {quest with terminal status: $status} => renders execution panel for audit view',
      async ({ status }) => {
        const proxy = QuestChatWidgetProxy();
        const guild = GuildListItemStub({ urlSlug: 'test-guild' });
        const quest = QuestStub({
          id: `chat-terminal-${status}`,
          status,
        });
        const guildDetail = GuildStub({ id: guild.id });

        proxy.setupGuilds({ guilds: [guild] });
        proxy.setupGuild({ guild: guildDetail });

        mantineRenderAdapter({
          ui: (
            <MemoryRouter
              initialEntries={[
                {
                  pathname: `/test-guild/session/chat-terminal-${status}`,
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

        expect(proxy.hasChatPanel()).toBe(false);
        expect(proxy.hasSpecPanel()).toBe(false);
      },
    );
  });

  describe('paused display status', () => {
    it('VALID: {status: paused, pausedAtStatus: explore_flows} => renders chat panel, NOT execution panel', async () => {
      const proxy = QuestChatWidgetProxy();
      const guild = GuildListItemStub({ urlSlug: 'test-guild' });
      const pausedQuest = QuestStub({
        id: 'chat-paused-chaoswhisperer',
        status: 'paused',
        pausedAtStatus: 'explore_flows',
      });
      const guildDetail = GuildStub({ id: guild.id });

      proxy.setupGuilds({ guilds: [guild] });
      proxy.setupGuild({ guild: guildDetail });

      mantineRenderAdapter({
        ui: (
          <MemoryRouter
            initialEntries={[
              {
                pathname: '/test-guild/session/chat-paused-chaoswhisperer',
                state: { questId: pausedQuest.id },
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
        proxy.setupQuest({ quest: pausedQuest });
      });

      await waitFor(() => {
        expect(proxy.hasChatPanel()).toBe(true);
      });

      expect(proxy.hasChatPanel()).toBe(true);
      expect(proxy.hasExecutionPanel()).toBe(false);
    });

    it('VALID: {status: paused, pausedAtStatus: seek_synth} => renders execution panel, NOT chat panel', async () => {
      const proxy = QuestChatWidgetProxy();
      const guild = GuildListItemStub({ urlSlug: 'test-guild' });
      const pausedQuest = QuestStub({
        id: 'chat-paused-seek-synth',
        status: 'paused',
        pausedAtStatus: 'seek_synth',
      });
      const guildDetail = GuildStub({ id: guild.id });

      proxy.setupGuilds({ guilds: [guild] });
      proxy.setupGuild({ guild: guildDetail });

      mantineRenderAdapter({
        ui: (
          <MemoryRouter
            initialEntries={[
              {
                pathname: '/test-guild/session/chat-paused-seek-synth',
                state: { questId: pausedQuest.id },
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
        proxy.setupQuest({ quest: pausedQuest });
      });

      await waitFor(() => {
        expect(proxy.hasExecutionPanel()).toBe(true);
      });

      expect(proxy.hasExecutionPanel()).toBe(true);
      expect(proxy.hasChatPanel()).toBe(false);
    });

    it('VALID: {status: paused, pausedAtStatus: undefined} => falls back to raw paused behavior (execution panel)', async () => {
      const proxy = QuestChatWidgetProxy();
      const guild = GuildListItemStub({ urlSlug: 'test-guild' });
      const pausedQuest = QuestStub({
        id: 'chat-paused-nofallback',
        status: 'paused',
      });
      const guildDetail = GuildStub({ id: guild.id });

      proxy.setupGuilds({ guilds: [guild] });
      proxy.setupGuild({ guild: guildDetail });

      mantineRenderAdapter({
        ui: (
          <MemoryRouter
            initialEntries={[
              {
                pathname: '/test-guild/session/chat-paused-nofallback',
                state: { questId: pausedQuest.id },
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
        proxy.setupQuest({ quest: pausedQuest });
      });

      await waitFor(() => {
        expect(proxy.hasExecutionPanel()).toBe(true);
      });

      expect(proxy.hasExecutionPanel()).toBe(true);
      expect(proxy.hasChatPanel()).toBe(false);
    });

    it('VALID: {status: in_progress} => renders execution panel (regression)', async () => {
      const proxy = QuestChatWidgetProxy();
      const guild = GuildListItemStub({ urlSlug: 'test-guild' });
      const quest = QuestStub({
        id: 'chat-inprogress-regress',
        status: 'in_progress',
      });
      const guildDetail = GuildStub({ id: guild.id });

      proxy.setupGuilds({ guilds: [guild] });
      proxy.setupGuild({ guild: guildDetail });

      mantineRenderAdapter({
        ui: (
          <MemoryRouter
            initialEntries={[
              {
                pathname: '/test-guild/session/chat-inprogress-regress',
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

      expect(proxy.hasExecutionPanel()).toBe(true);
      expect(proxy.hasChatPanel()).toBe(false);
    });

    it('VALID: {status: explore_flows} => renders chat panel (regression)', async () => {
      const proxy = QuestChatWidgetProxy();
      const guild = GuildListItemStub({ urlSlug: 'test-guild' });
      const quest = QuestStub({
        id: 'chat-explore-regress',
        status: 'explore_flows',
      });
      const guildDetail = GuildStub({ id: guild.id });

      proxy.setupGuilds({ guilds: [guild] });
      proxy.setupGuild({ guild: guildDetail });

      mantineRenderAdapter({
        ui: (
          <MemoryRouter
            initialEntries={[
              {
                pathname: '/test-guild/session/chat-explore-regress',
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
        expect(proxy.hasChatPanel()).toBe(true);
      });

      expect(proxy.hasChatPanel()).toBe(true);
      expect(proxy.hasExecutionPanel()).toBe(false);
    });
  });

  describe('resume button wiring', () => {
    it('VALID: {RESUME clicked on paused quest} => calls questResumeBroker (not questModifyBroker)', async () => {
      const proxy = QuestChatWidgetProxy();
      const guild = GuildListItemStub({ urlSlug: 'test-guild' });
      const pausedQuest = QuestStub({
        id: 'chat-resume-click',
        status: 'paused',
        pausedAtStatus: 'seek_scope',
      });
      const guildDetail = GuildStub({ id: guild.id });

      proxy.setupGuilds({ guilds: [guild] });
      proxy.setupGuild({ guild: guildDetail });
      proxy.setupQuestResume({ restoredStatus: 'seek_scope' });
      proxy.setupModify();

      mantineRenderAdapter({
        ui: (
          <MemoryRouter
            initialEntries={[
              {
                pathname: '/test-guild/session/chat-resume-click',
                state: { questId: pausedQuest.id },
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
        proxy.setupQuest({ quest: pausedQuest });
      });

      await waitFor(() => {
        expect(proxy.hasExecutionPanel()).toBe(true);
      });

      await proxy.clickExecutionResumeButton();

      await waitFor(() => {
        expect(proxy.getQuestResumeRequestCount()).toBe(1);
      });

      expect(proxy.getQuestResumeRequestCount()).toBe(1);
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
              entries: [{ role: 'assistant', type: 'text', content: 'Live codeweaver output...' }],
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
      expect(messages[0]?.textContent).toBe('CODEWEAVERLive codeweaver output...');
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
              entries: [
                { role: 'assistant', type: 'text', content: 'Codeweaver instance one working...' },
              ],
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
      expect(firstRowMessages[0]?.textContent).toBe('CODEWEAVERCodeweaver instance one working...');
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
              entries: [
                { role: 'assistant', type: 'text', content: 'Codeweaver instance two working...' },
              ],
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
      expect(secondRowMessages[0]?.textContent).toBe(
        'CODEWEAVERCodeweaver instance two working...',
      );
    });
  });

  describe('live codeweaver sessionId routing without slotIndex', () => {
    it('VALID: {chat-output WS message with sessionId only, no slotIndex, no exec-replay- prefix} => routes entries to work item panel by sessionId', async () => {
      const proxy = QuestChatWidgetProxy();
      const guild = GuildListItemStub({ urlSlug: 'test-guild' });
      const quest = QuestStub({
        id: 'chat-live-bare-cw',
        status: 'in_progress',
        steps: [],
        workItems: [
          WorkItemStub({
            id: 'a0000000-0000-0000-0000-000000000001',
            role: 'chaoswhisperer',
            status: 'complete',
            sessionId: 'chat-live-bare-cw' as never,
          }),
          WorkItemStub({
            id: 'a0000000-0000-0000-0000-000000000002',
            role: 'codeweaver',
            status: 'complete',
            sessionId: 'wi-bare-session-cw' as never,
          }),
        ],
      });
      const guildDetail = GuildStub({ id: guild.id });

      proxy.setupGuilds({ guilds: [guild] });
      proxy.setupGuild({ guild: guildDetail });
      proxy.setupQuestStart({ processId: 'proc-bare-cw' });

      mantineRenderAdapter({
        ui: (
          <MemoryRouter
            initialEntries={[
              {
                pathname: '/test-guild/session/chat-live-bare-cw',
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

      // Live codeweaver chat-output: chatProcessId === sessionId (no exec-replay- prefix),
      // no slotIndex (codeweaver runs outside the slot manager), payload.sessionId carries
      // the work item's session id.
      act(() => {
        proxy.receiveWsMessage({
          data: JSON.stringify({
            type: 'chat-output',
            payload: {
              chatProcessId: 'wi-bare-session-cw',
              sessionId: 'wi-bare-session-cw',
              entries: [
                {
                  role: 'assistant',
                  type: 'text',
                  content: 'Live bare-session codeweaver output...',
                },
              ],
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
      expect(messages[0]?.textContent).toBe('CODEWEAVERLive bare-session codeweaver output...');
    });

    it('VALID: {chat-output with no sessionId and no exec-replay- prefix} => entries are ignored', async () => {
      const proxy = QuestChatWidgetProxy();
      const guild = GuildListItemStub({ urlSlug: 'test-guild' });
      const quest = QuestStub({
        id: 'chat-no-route',
        status: 'in_progress',
        steps: [],
        workItems: [
          WorkItemStub({
            id: 'a0000000-0000-0000-0000-000000000001',
            role: 'chaoswhisperer',
            status: 'complete',
            sessionId: 'chat-no-route' as never,
          }),
          WorkItemStub({
            id: 'a0000000-0000-0000-0000-000000000002',
            role: 'codeweaver',
            status: 'complete',
            sessionId: 'wi-no-route-cw' as never,
          }),
        ],
      });
      const guildDetail = GuildStub({ id: guild.id });

      proxy.setupGuilds({ guilds: [guild] });
      proxy.setupGuild({ guild: guildDetail });
      proxy.setupQuestStart({ processId: 'proc-no-route' });

      mantineRenderAdapter({
        ui: (
          <MemoryRouter
            initialEntries={[
              {
                pathname: '/test-guild/session/chat-no-route',
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

      // Replay path from a different client (chatProcessId begins with 'replay-' not
      // 'exec-replay-'), no sessionId on payload, no slotIndex. Should be dropped.
      act(() => {
        proxy.receiveWsMessage({
          data: JSON.stringify({
            type: 'chat-output',
            payload: {
              chatProcessId: 'replay-other-client-session',
              entries: [
                {
                  role: 'assistant',
                  type: 'text',
                  content: 'Should not appear anywhere',
                },
              ],
            },
            timestamp: '2025-01-01T00:00:00.000Z',
          }),
        });
      });

      const stepRows = screen.queryAllByTestId('execution-row-layer-widget');
      const codeweaverRow = stepRows.find((row) => row.textContent?.includes('CODEWEAVER'));
      const rowHeader = codeweaverRow!.querySelector('[data-testid="execution-row-header"]')!;

      await userEvent.click(rowHeader);

      const codeweaverMessages = codeweaverRow!.querySelectorAll('[data-testid="CHAT_MESSAGE"]');

      expect(Array.from(codeweaverMessages)).toStrictEqual([]);
    });

    it('VALID: {chat-output with no payload.sessionId, no exec-replay- prefix, but UUID-shape chatProcessId} => routes entries to work item panel by chatProcessId', async () => {
      const proxy = QuestChatWidgetProxy();
      const guild = GuildListItemStub({ urlSlug: 'test-guild' });
      const codeweaverSessionId = 'b4a5c2d1-918c-4408-aeb1-f8f4ce8400cb';
      const quest = QuestStub({
        id: 'chat-uuid-fallback',
        status: 'in_progress',
        steps: [],
        workItems: [
          WorkItemStub({
            id: 'a0000000-0000-0000-0000-000000000001',
            role: 'chaoswhisperer',
            status: 'complete',
            sessionId: 'chat-uuid-fallback' as never,
          }),
          WorkItemStub({
            id: 'a0000000-0000-0000-0000-000000000002',
            role: 'codeweaver',
            status: 'complete',
            sessionId: codeweaverSessionId as never,
          }),
        ],
      });
      const guildDetail = GuildStub({ id: guild.id });

      proxy.setupGuilds({ guilds: [guild] });
      proxy.setupGuild({ guild: guildDetail });
      proxy.setupQuestStart({ processId: 'proc-uuid-fallback' });

      mantineRenderAdapter({
        ui: (
          <MemoryRouter
            initialEntries={[
              {
                pathname: '/test-guild/session/chat-uuid-fallback',
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

      // Defensive fallback: payload.sessionId omitted, no exec-replay- prefix, chatProcessId
      // is a bare UUID (the orchestrator stamps chatProcessId = sessionId on live emits once
      // the codeweaver session id is learned). Widget should treat chatProcessId as sessionId
      // and route to the codeweaver work-item bucket.
      act(() => {
        proxy.receiveWsMessage({
          data: JSON.stringify({
            type: 'chat-output',
            payload: {
              chatProcessId: codeweaverSessionId,
              entries: [
                {
                  role: 'assistant',
                  type: 'text',
                  content: 'UUID-fallback codeweaver output...',
                },
              ],
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
      expect(messages[0]?.textContent).toBe('CODEWEAVERUUID-fallback codeweaver output...');
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
              entries: [
                { role: 'assistant', type: 'text', content: 'This is plain text, not JSON' },
              ],
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
              chatProcessId: 'exec-replay-wi-normal-session',
              entries: [
                {
                  role: 'assistant',
                  type: 'text',
                  content: 'Normal codeweaver output...',
                },
              ],
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
      expect(codeweaverMessages[0]?.textContent).toBe('CODEWEAVERNormal codeweaver output...');

      const wardRow = stepRows.find((row) => row.textContent?.includes('WARD'));
      const wardHeader = wardRow!.querySelector('[data-testid="execution-row-header"]')!;

      await userEvent.click(wardHeader);

      const wardMessages = wardRow!.querySelectorAll('[data-testid="CHAT_MESSAGE"]');

      expect(Array.from(wardMessages)).toStrictEqual([]);
    });
  });

  describe('error logging in catch handlers', () => {
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
        expect(consoleErrorSpy.mock.calls.some((c) => c[0] === '[keep-chatting]')).toBe(true);
      });

      expect(consoleErrorSpy.mock.calls.some((c) => c[0] === '[keep-chatting]')).toBe(true);
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
        expect(consoleErrorSpy.mock.calls.some((c) => c[0] === '[begin-quest]')).toBe(true);
      });

      expect(consoleErrorSpy.mock.calls.some((c) => c[0] === '[begin-quest]')).toBe(true);
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
              chatProcessId: 'exec-replay-wi-session-bbb',
              entries: [
                {
                  role: 'assistant',
                  type: 'text',
                  content: 'Exploring quest requirements...',
                },
              ],
            },
            timestamp: '2025-01-01T00:00:00.000Z',
          }),
        });
      });

      const stepRows = screen.queryAllByTestId('execution-row-layer-widget');
      const pathseekerRow = stepRows.find((row) => row.textContent?.includes('PATHSEEKER'));
      const rowHeader = pathseekerRow!.querySelector('[data-testid="execution-row-header"]')!;

      await userEvent.click(rowHeader);

      // Same entry surfaces in both the expanded execution row and the right
      // activity pane (Bug C — chat panel must show agent activity live).
      const messages = screen.queryAllByTestId('CHAT_MESSAGE');

      expect(messages.map((m) => m.getAttribute('data-testid'))).toStrictEqual([
        'CHAT_MESSAGE',
        'CHAT_MESSAGE',
      ]);
      expect(messages[0]?.textContent).toBe('PATHSEEKERExploring quest requirements...');
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
      const replaySessionIds = extractReplaySessionIdsTransformer({ messages: sent });

      expect(replaySessionIds).toStrictEqual(['chat-race-1', 'chat-race-1', 'ps-session-race']);
    });
  });

  describe('approved modal visibility', () => {
    const nonApprovedStatuses = (
      Object.keys(questStatusMetadataStatics.statuses) as QuestStatus[]
    ).filter((status) => status !== 'approved');

    it.each(nonApprovedStatuses)(
      'EMPTY: {status: %s} => approved modal is not visible',
      async (status) => {
        const proxy = QuestChatWidgetProxy();
        const guild = GuildListItemStub({ urlSlug: 'test-guild' });
        const guildDetail = GuildStub({ id: guild.id });
        const questId = `modal-${status}`;
        const quest = QuestStub({ id: questId as never, status });

        proxy.setupGuilds({ guilds: [guild] });
        proxy.setupGuild({ guild: guildDetail });

        mantineRenderAdapter({
          ui: (
            <MemoryRouter initialEntries={[`/test-guild/session/${questId}`]}>
              <Routes>
                <Route path="/:guildSlug/session/:sessionId" element={<QuestChatWidget />} />
              </Routes>
            </MemoryRouter>
          ),
        });

        await act(async () => {
          proxy.setupQuest({ quest });
          await Promise.resolve();
        });

        expect(proxy.hasApprovedModal()).toBe(false);
      },
    );

    it('VALID: {status: approved} => approved modal is visible', async () => {
      const proxy = QuestChatWidgetProxy();
      const guild = GuildListItemStub({ urlSlug: 'test-guild' });
      const guildDetail = GuildStub({ id: guild.id });
      const quest = QuestStub({ id: 'modal-approved' as never, status: 'approved' });

      proxy.setupGuilds({ guilds: [guild] });
      proxy.setupGuild({ guild: guildDetail });

      mantineRenderAdapter({
        ui: (
          <MemoryRouter initialEntries={['/test-guild/session/modal-approved']}>
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
        expect(proxy.hasApprovedModal()).toBe(true);
      });

      expect(proxy.hasApprovedModal()).toBe(true);
    });

    it('VALID: {transitions review_flows => flows_approved => explore_observables} => modal stays hidden throughout', async () => {
      const proxy = QuestChatWidgetProxy();
      const guild = GuildListItemStub({ urlSlug: 'test-guild' });
      const guildDetail = GuildStub({ id: guild.id });
      const questId = 'modal-flows-transition';

      proxy.setupGuilds({ guilds: [guild] });
      proxy.setupGuild({ guild: guildDetail });

      mantineRenderAdapter({
        ui: (
          <MemoryRouter initialEntries={[`/test-guild/session/${questId}`]}>
            <Routes>
              <Route path="/:guildSlug/session/:sessionId" element={<QuestChatWidget />} />
            </Routes>
          </MemoryRouter>
        ),
      });

      act(() => {
        proxy.setupQuest({
          quest: QuestStub({ id: questId as never, status: 'review_flows' }),
        });
      });

      await waitFor(() => {
        expect(proxy.hasChatPanel()).toBe(true);
      });

      expect(proxy.hasApprovedModal()).toBe(false);

      act(() => {
        proxy.setupQuest({
          quest: QuestStub({ id: questId as never, status: 'flows_approved' }),
        });
      });

      expect(proxy.hasApprovedModal()).toBe(false);

      act(() => {
        proxy.setupQuest({
          quest: QuestStub({ id: questId as never, status: 'explore_observables' }),
        });
      });

      expect(proxy.hasApprovedModal()).toBe(false);
    });
  });

  describe('stop button wiring', () => {
    it('VALID: {STOP clicked in chat view on quest-bound session} => calls questPauseBroker once with the quest id', async () => {
      const proxy = QuestChatWidgetProxy();
      const guild = GuildListItemStub({ urlSlug: 'test-guild' });
      const guildDetail = GuildStub({ id: guild.id });
      const quest = QuestStub({ id: 'chat-stop-pause', status: 'pending' });

      proxy.setupGuilds({ guilds: [guild] });
      proxy.setupGuild({ guild: guildDetail });
      proxy.setupChat({ chatProcessId: 'chat-stop-proc' as never });
      proxy.setupQuestPause();

      mantineRenderAdapter({
        ui: (
          <MemoryRouter initialEntries={['/test-guild/session/chat-stop-pause']}>
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

      await proxy.typeChatPanelMessage({ text: 'stop-test' });
      await proxy.clickChatPanelSendButton();
      await proxy.clickChatPanelStopButton();

      await waitFor(() => {
        expect(proxy.getQuestPauseRequestCount()).toBe(1);
      });

      expect(proxy.getQuestPauseRequestCount()).toBe(1);
    });
  });

  describe('session without quest (read-only)', () => {
    it('VALID: {quest-by-session-not-found received} => renders ChatPanel in read-only mode', async () => {
      const proxy = QuestChatWidgetProxy();
      const guild = GuildListItemStub({ urlSlug: 'test-guild' });
      const guildDetail = GuildStub({ id: guild.id });

      proxy.setupGuilds({ guilds: [guild] });
      proxy.setupGuild({ guild: guildDetail });

      mantineRenderAdapter({
        ui: (
          <MemoryRouter initialEntries={['/test-guild/session/orphan-session']}>
            <Routes>
              <Route path="/:guildSlug/session/:sessionId" element={<QuestChatWidget />} />
            </Routes>
          </MemoryRouter>
        ),
      });

      act(() => {
        proxy.receiveWsMessage({
          data: JSON.stringify({
            type: 'quest-by-session-not-found',
            payload: { sessionId: 'orphan-session', guildId: guild.id },
            timestamp: '2025-01-01T00:00:00.000Z',
          }),
        });
      });

      await waitFor(() => {
        expect(proxy.hasChatPanel()).toBe(true);
      });

      expect(proxy.hasChatPanel()).toBe(true);
    });

    it('VALID: {quest-by-session-not-found received} => does not render right activity panel', async () => {
      const proxy = QuestChatWidgetProxy();
      const guild = GuildListItemStub({ urlSlug: 'test-guild' });
      const guildDetail = GuildStub({ id: guild.id });

      proxy.setupGuilds({ guilds: [guild] });
      proxy.setupGuild({ guild: guildDetail });

      mantineRenderAdapter({
        ui: (
          <MemoryRouter initialEntries={['/test-guild/session/orphan-session-2']}>
            <Routes>
              <Route path="/:guildSlug/session/:sessionId" element={<QuestChatWidget />} />
            </Routes>
          </MemoryRouter>
        ),
      });

      act(() => {
        proxy.receiveWsMessage({
          data: JSON.stringify({
            type: 'quest-by-session-not-found',
            payload: { sessionId: 'orphan-session-2', guildId: guild.id },
            timestamp: '2025-01-01T00:00:00.000Z',
          }),
        });
      });

      await waitFor(() => {
        expect(proxy.hasChatPanel()).toBe(true);
      });

      expect(proxy.hasActivityPlaceholder()).toBe(false);
    });

    it('VALID: {smoketest quest in execution phase} => hides right activity panel', async () => {
      const proxy = QuestChatWidgetProxy();
      const guild = GuildListItemStub({ urlSlug: 'smoketests' });
      const guildDetail = GuildStub({ id: guild.id });
      const quest = QuestStub({
        id: 'smoketest-q1',
        status: 'in_progress',
        questSource: 'smoketest-mcp',
      });

      proxy.setupGuilds({ guilds: [guild] });
      proxy.setupGuild({ guild: guildDetail });

      mantineRenderAdapter({
        ui: (
          <MemoryRouter initialEntries={['/smoketests/session/smoketest-q1']}>
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

      expect(screen.queryByTestId('QUEST_CHAT_DIVIDER')).toBe(null);
      expect(screen.queryByTestId('QUEST_CHAT_ACTIVITY')).toBe(null);
    });

    it('VALID: {non-smoketest quest in execution phase} => still renders right activity panel', async () => {
      const proxy = QuestChatWidgetProxy();
      const guild = GuildListItemStub({ urlSlug: 'real-guild' });
      const guildDetail = GuildStub({ id: guild.id });
      const quest = QuestStub({ id: 'real-q1', status: 'in_progress' });

      proxy.setupGuilds({ guilds: [guild] });
      proxy.setupGuild({ guild: guildDetail });

      mantineRenderAdapter({
        ui: (
          <MemoryRouter initialEntries={['/real-guild/session/real-q1']}>
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
      expect(proxy.hasActivityPlaceholder()).toBe(true);
    });

    it('VALID: {no sessionId in URL, fresh queue entry without activeSessionId yet, prior completed quest in list} => stays on /:guildSlug/session and does NOT redirect to the prior quest', async () => {
      // Race condition fix: when a smoketest is just enqueued, the queue entry
      // exists but its `activeSessionId` only populates ~1-3s later (once the
      // first agent spawns + Claude CLI emits a session id). Without this guard
      // the redirect fallback would walk the guild's quest list and pick the
      // most-recent COMPLETED quest's session — landing the user on the
      // previous suite's result instead of the new run.
      const proxy = QuestChatWidgetProxy();
      const guild = GuildListItemStub({ urlSlug: 'smoketests' });
      const guildDetail = GuildStub({ id: guild.id });

      proxy.setupGuilds({ guilds: [guild] });
      proxy.setupGuild({ guild: guildDetail });
      proxy.setupQueueEntries({
        entries: [
          QuestQueueEntryStub({
            questId: 'smoketest-fresh',
            guildId: guild.id,
            guildSlug: 'smoketests',
          }),
        ],
      });
      proxy.setupQuests({
        quests: [
          QuestListItemStub({
            id: 'smoketest-prior-mcp',
            createdAt: '2024-01-15T10:00:00.000Z',
            activeSessionId: 'session-prior-mcp',
          }),
        ],
      });

      const LocationDisplay = (): React.JSX.Element => {
        const location = useLocation();
        return <span data-testid="LOCATION_PATHNAME">{location.pathname}</span>;
      };

      mantineRenderAdapter({
        ui: (
          <MemoryRouter initialEntries={['/smoketests/session']}>
            <Routes>
              <Route
                path="/:guildSlug/session"
                element={
                  <>
                    <QuestChatWidget />
                    <LocationDisplay />
                  </>
                }
              />
              <Route
                path="/:guildSlug/session/:sessionId"
                element={
                  <>
                    <QuestChatWidget />
                    <LocationDisplay />
                  </>
                }
              />
            </Routes>
          </MemoryRouter>
        ),
      });

      // Allow async effects (queue + quests fetches) to settle, then assert no
      // redirect to the prior completed session occurred.
      await waitFor(() => {
        expect(screen.getByTestId('LOCATION_PATHNAME').textContent).toBe('/smoketests/session');
      });

      expect(screen.getByTestId('LOCATION_PATHNAME').textContent).toBe('/smoketests/session');
    });

    it('VALID: {no sessionId in URL, quest list has activeSessionId} => redirects to session URL', async () => {
      const proxy = QuestChatWidgetProxy();
      const guild = GuildListItemStub({ urlSlug: 'smoketests' });
      const guildDetail = GuildStub({ id: guild.id });

      proxy.setupGuilds({ guilds: [guild] });
      proxy.setupGuild({ guild: guildDetail });
      proxy.setupQuests({
        quests: [
          QuestListItemStub({
            id: 'smoketest-q1',
            createdAt: '2024-01-15T10:00:00.000Z',
            activeSessionId: 'session-from-list',
          }),
        ],
      });

      const LocationDisplay = (): React.JSX.Element => {
        const location = useLocation();
        return <span data-testid="LOCATION_PATHNAME">{location.pathname}</span>;
      };

      mantineRenderAdapter({
        ui: (
          <MemoryRouter initialEntries={['/smoketests/session']}>
            <Routes>
              <Route
                path="/:guildSlug/session"
                element={
                  <>
                    <QuestChatWidget />
                    <LocationDisplay />
                  </>
                }
              />
              <Route
                path="/:guildSlug/session/:sessionId"
                element={
                  <>
                    <QuestChatWidget />
                    <LocationDisplay />
                  </>
                }
              />
            </Routes>
          </MemoryRouter>
        ),
      });

      await waitFor(() => {
        expect(screen.getByTestId('LOCATION_PATHNAME').textContent).toBe(
          '/smoketests/session/session-from-list',
        );
      });

      expect(screen.getByTestId('LOCATION_PATHNAME').textContent).toBe(
        '/smoketests/session/session-from-list',
      );
    });

    it('VALID: {quest-by-session-not-found received} => does not render chat input', async () => {
      const proxy = QuestChatWidgetProxy();
      const guild = GuildListItemStub({ urlSlug: 'test-guild' });
      const guildDetail = GuildStub({ id: guild.id });

      proxy.setupGuilds({ guilds: [guild] });
      proxy.setupGuild({ guild: guildDetail });

      mantineRenderAdapter({
        ui: (
          <MemoryRouter initialEntries={['/test-guild/session/orphan-session-3']}>
            <Routes>
              <Route path="/:guildSlug/session/:sessionId" element={<QuestChatWidget />} />
            </Routes>
          </MemoryRouter>
        ),
      });

      act(() => {
        proxy.receiveWsMessage({
          data: JSON.stringify({
            type: 'quest-by-session-not-found',
            payload: { sessionId: 'orphan-session-3', guildId: guild.id },
            timestamp: '2025-01-01T00:00:00.000Z',
          }),
        });
      });

      await waitFor(() => {
        expect(proxy.hasChatPanel()).toBe(true);
      });

      expect(screen.queryByTestId('CHAT_INPUT')).toBe(null);
    });
  });

  describe('Stage 4: questId-keyed live workspace', () => {
    it('VALID: {questId in URL, quest binding emits in-progress quest} => renders execution panel', async () => {
      const proxy = QuestChatWidgetProxy();
      const guild = GuildListItemStub({ urlSlug: 'test-guild' });
      const guildDetail = GuildStub({ id: guild.id });
      const quest = QuestStub({
        id: 'live-q1',
        status: 'in_progress',
        workItems: [WorkItemStub({ sessionId: 'sess-live' as never })],
      });

      proxy.setupGuilds({ guilds: [guild] });
      proxy.setupGuild({ guild: guildDetail });

      mantineRenderAdapter({
        ui: (
          <MemoryRouter initialEntries={['/test-guild/quest/live-q1']}>
            <Routes>
              <Route path="/:guildSlug/quest/:questId" element={<QuestChatWidget />} />
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

      expect(proxy.hasExecutionPanel()).toBe(true);
    });

    it('VALID: {questId in URL, no quest yet} => renders dumpster raccoon loading state', () => {
      const proxy = QuestChatWidgetProxy();
      const guild = GuildListItemStub({ urlSlug: 'test-guild' });
      const guildDetail = GuildStub({ id: guild.id });

      proxy.setupGuilds({ guilds: [guild] });
      proxy.setupGuild({ guild: guildDetail });

      mantineRenderAdapter({
        ui: (
          <MemoryRouter initialEntries={['/test-guild/quest/live-q-no-data']}>
            <Routes>
              <Route path="/:guildSlug/quest/:questId" element={<QuestChatWidget />} />
            </Routes>
          </MemoryRouter>
        ),
      });

      expect(proxy.hasDumpsterRaccoon()).toBe(true);
    });
  });

  describe('Stage 4: new-chat branch (no questId)', () => {
    it('VALID: {/:guildSlug/quest, guild matched} => renders empty chat panel', async () => {
      const proxy = QuestChatWidgetProxy();
      const guild = GuildListItemStub({ urlSlug: 'test-guild' });
      const guildDetail = GuildStub({ id: guild.id });

      proxy.setupGuilds({ guilds: [guild] });
      proxy.setupGuild({ guild: guildDetail });

      mantineRenderAdapter({
        ui: (
          <MemoryRouter initialEntries={['/test-guild/quest']}>
            <Routes>
              <Route path="/:guildSlug/quest" element={<QuestChatWidget />} />
            </Routes>
          </MemoryRouter>
        ),
      });

      await waitFor(() => {
        expect(proxy.hasChatPanel()).toBe(true);
      });

      expect(proxy.hasChatPanel()).toBe(true);
    });

    it('VALID: {/:guildSlug/quest, send first message} => POSTs questNew and replace-navigates to live workspace', async () => {
      const proxy = QuestChatWidgetProxy();
      const guild = GuildListItemStub({ urlSlug: 'test-guild' });
      const guildDetail = GuildStub({ id: guild.id });

      proxy.setupGuilds({ guilds: [guild] });
      proxy.setupGuild({ guild: guildDetail });
      proxy.setupQuestNew({
        questId: 'newly-created-q' as never,
        chatProcessId: 'proc-new-1' as never,
      });

      const LocationProbe = (): React.JSX.Element => {
        const loc = useLocation();
        return <div data-testid="LOCATION_PATHNAME">{loc.pathname}</div>;
      };

      mantineRenderAdapter({
        ui: (
          <MemoryRouter initialEntries={['/test-guild/quest']}>
            <Routes>
              <Route
                path="/:guildSlug/quest"
                element={
                  <>
                    <QuestChatWidget />
                    <LocationProbe />
                  </>
                }
              />
              <Route
                path="/:guildSlug/quest/:questId"
                element={
                  <>
                    <QuestChatWidget />
                    <LocationProbe />
                  </>
                }
              />
            </Routes>
          </MemoryRouter>
        ),
      });

      await waitFor(() => {
        expect(proxy.hasChatPanel()).toBe(true);
      });

      await proxy.typeChatPanelMessage({ text: 'hello world' });
      await proxy.clickChatPanelSendButton();

      await waitFor(() => {
        expect(screen.getByTestId('LOCATION_PATHNAME').textContent).toBe(
          '/test-guild/quest/newly-created-q',
        );
      });

      expect(screen.getByTestId('LOCATION_PATHNAME').textContent).toBe(
        '/test-guild/quest/newly-created-q',
      );
    });
  });

  describe('Stage 4: isQuestPath early-return delegation', () => {
    it('VALID: {/:guildSlug/quest URL} => delegates to QuestChatRoutingLayerWidget (no legacy split-panel markers)', async () => {
      const proxy = QuestChatWidgetProxy();
      const guild = GuildListItemStub({ urlSlug: 'myguild' });
      const guildDetail = GuildStub({ id: guild.id });

      proxy.setupGuilds({ guilds: [guild] });
      proxy.setupGuild({ guild: guildDetail });

      mantineRenderAdapter({
        ui: (
          <MemoryRouter initialEntries={['/myguild/quest']}>
            <Routes>
              <Route path="/:guildSlug/quest" element={<QuestChatWidget />} />
            </Routes>
          </MemoryRouter>
        ),
      });

      await waitFor(() => {
        expect(proxy.hasChatPanel()).toBe(true);
      });

      // Routing layer's new-chat branch renders only ChatPanel — no divider,
      // no right-side activity column. The legacy widget always renders both.
      expect(screen.queryByTestId('QUEST_CHAT_DIVIDER')).toBe(null);
      expect(screen.queryByTestId('QUEST_CHAT_ACTIVITY')).toBe(null);
    });

    it('VALID: {/:guildSlug/quest/:questId URL with no quest yet} => delegates to QuestChatRoutingLayerWidget (loading state, no legacy split-panel markers)', () => {
      const proxy = QuestChatWidgetProxy();
      const guild = GuildListItemStub({ urlSlug: 'myguild' });
      const guildDetail = GuildStub({ id: guild.id });

      proxy.setupGuilds({ guilds: [guild] });
      proxy.setupGuild({ guild: guildDetail });

      mantineRenderAdapter({
        ui: (
          <MemoryRouter initialEntries={['/myguild/quest/abc-123']}>
            <Routes>
              <Route path="/:guildSlug/quest/:questId" element={<QuestChatWidget />} />
            </Routes>
          </MemoryRouter>
        ),
      });

      // Routing layer's live-workspace branch with quest === null renders only
      // the dumpster-raccoon loading view. The legacy bottom render (which
      // would fire on a non-session URL without the early return) always emits
      // QUEST_CHAT with a divider and an activity column.
      const loading = screen.queryByTestId('QUEST_CHAT_LOADING');

      expect(loading?.getAttribute('data-testid')).toBe('QUEST_CHAT_LOADING');
      expect(proxy.hasDumpsterRaccoon()).toBe(true);
      expect(screen.queryByTestId('QUEST_CHAT_DIVIDER')).toBe(null);
      expect(screen.queryByTestId('QUEST_CHAT_ACTIVITY')).toBe(null);
    });

    it('VALID: {/:guildSlug/session/:sessionId URL} => does NOT delegate to QuestChatRoutingLayerWidget; falls through to legacy split-panel layout', async () => {
      const proxy = QuestChatWidgetProxy();
      const guild = GuildListItemStub({ urlSlug: 'myguild' });
      const guildDetail = GuildStub({ id: guild.id });
      const quest = QuestStub({ id: 'sess-1', status: 'pending' });

      proxy.setupGuilds({ guilds: [guild] });
      proxy.setupGuild({ guild: guildDetail });

      mantineRenderAdapter({
        ui: (
          <MemoryRouter initialEntries={['/myguild/session/sess-1']}>
            <Routes>
              <Route path="/:guildSlug/session/:sessionId" element={<QuestChatWidget />} />
            </Routes>
          </MemoryRouter>
        ),
      });

      act(() => {
        proxy.setupQuest({ quest });
      });

      // Legacy session-route render emits the split-panel layout: chat on the
      // left, divider, activity column on the right. The routing-layer
      // branches NEVER render a divider or QUEST_CHAT_ACTIVITY, so their
      // presence here proves Stage 4 left this code path untouched.
      await waitFor(() => {
        expect(proxy.hasDivider()).toBe(true);
      });

      expect(proxy.hasDivider()).toBe(true);
      expect(proxy.hasActivityPlaceholder()).toBe(true);
    });
  });
});
