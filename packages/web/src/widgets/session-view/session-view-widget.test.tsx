import {
  AssistantTextChatEntryStub,
  GuildIdStub,
  GuildListItemStub,
  ProcessIdStub,
  QuestIdStub,
  QuestWorkItemIdStub,
  SessionIdStub,
  TaskNotificationChatEntryStub,
  TaskToolUseChatEntryStub,
} from '@dungeonmaster/shared/contracts';
import { act, screen, waitFor } from '@testing-library/react';
import { MemoryRouter, Route, Routes } from 'react-router-dom';

import { mantineRenderAdapter } from '../../adapters/mantine/render/mantine-render-adapter';
import { SessionViewWidget } from './session-view-widget';
import { SessionViewWidgetProxy } from './session-view-widget.proxy';

describe('SessionViewWidget', () => {
  describe('loading state', () => {
    it('VALID: {default before chat-history-complete} => renders DumpsterRaccoonWidget', async () => {
      const proxy = SessionViewWidgetProxy();
      proxy.setupGuilds({
        guilds: [
          GuildListItemStub({
            id: 'f47ac10b-58cc-4372-a567-0e02b2c3d479',
            urlSlug: 'my-guild' as never,
          }),
        ],
      });

      mantineRenderAdapter({
        ui: (
          <MemoryRouter initialEntries={['/my-guild/session/f47ac10b-58cc-4372-a567-0e02b2c3d479']}>
            <Routes>
              <Route path="/:guildSlug/session/:sessionId" element={<SessionViewWidget />} />
            </Routes>
          </MemoryRouter>
        ),
      });

      await waitFor(() => {
        expect(screen.getByTestId('dumpster-raccoon-widget')).toBeInTheDocument();
      });

      expect(screen.getByTestId('dumpster-raccoon-widget')).toBeInTheDocument();
    });
  });

  describe('rendered with entries', () => {
    it('VALID: {chat-history-complete after entries} => renders ChatPanelWidget readOnly', async () => {
      const proxy = SessionViewWidgetProxy();
      const sessionId = SessionIdStub({ value: 'f47ac10b-58cc-4372-a567-0e02b2c3d479' });
      proxy.setupGuilds({
        guilds: [
          GuildListItemStub({
            id: 'f47ac10b-58cc-4372-a567-0e02b2c3d479',
            urlSlug: 'my-guild' as never,
          }),
        ],
      });

      mantineRenderAdapter({
        ui: (
          <MemoryRouter initialEntries={[`/my-guild/session/${sessionId}`]}>
            <Routes>
              <Route path="/:guildSlug/session/:sessionId" element={<SessionViewWidget />} />
            </Routes>
          </MemoryRouter>
        ),
      });

      // Wait for guilds to resolve (DumpsterRaccoon shows while guildId is known but session
      // is loading) before opening the channel so guildIdRef is non-null when opens$ fires.
      await waitFor(() => {
        expect(screen.getByTestId('dumpster-raccoon-widget')).toBeInTheDocument();
      });

      act(() => {
        proxy.setupConnectedChannel();
      });

      const replayProcessId = ProcessIdStub({ value: `replay-${sessionId}` });

      await waitFor(() => {
        expect(proxy.getReplayHistorySent()).toBe(true);
      });

      act(() => {
        proxy.deliverWsMessage({
          data: JSON.stringify({
            type: 'chat-output',
            payload: {
              chatProcessId: replayProcessId,
              questId: QuestIdStub(),
              workItemId: QuestWorkItemIdStub(),
              entries: [
                {
                  role: 'assistant',
                  type: 'text',
                  content: 'replayed',
                  uuid: '00000000-0000-4000-8000-000000000001',
                  timestamp: '2025-01-01T00:00:00.000Z',
                },
              ],
            },
            timestamp: '2025-01-01T00:00:00.000Z',
          }),
        });
        proxy.deliverWsMessage({
          data: JSON.stringify({
            type: 'chat-history-complete',
            payload: { chatProcessId: replayProcessId },
            timestamp: '2025-01-01T00:00:00.000Z',
          }),
        });
      });

      await waitFor(() => {
        expect(screen.getByTestId('CHAT_PANEL')).toBeInTheDocument();
      });

      expect(screen.getByTestId('CHAT_PANEL')).toBeInTheDocument();
    });
  });

  describe('guild slug resolution', () => {
    it('VALID: {guildSlug matches guild urlSlug} => useSessionReplayBinding receives resolved guildId, not slug', async () => {
      const proxy = SessionViewWidgetProxy();
      const sessionId = SessionIdStub({ value: 'a1b2c3d4-e5f6-4789-abcd-1234567890ab' });
      const guildId = GuildIdStub({ value: 'b2c3d4e5-f6a7-4890-bcde-234567890abc' });
      proxy.setupGuilds({
        guilds: [
          GuildListItemStub({
            id: guildId,
            urlSlug: 'my-guild' as never,
          }),
        ],
      });

      mantineRenderAdapter({
        ui: (
          <MemoryRouter initialEntries={[`/my-guild/session/${sessionId}`]}>
            <Routes>
              <Route path="/:guildSlug/session/:sessionId" element={<SessionViewWidget />} />
            </Routes>
          </MemoryRouter>
        ),
      });

      await waitFor(() => {
        expect(screen.getByTestId('dumpster-raccoon-widget')).toBeInTheDocument();
      });

      act(() => {
        proxy.setupConnectedChannel();
      });

      await waitFor(() => {
        expect(proxy.getReplayHistorySent()).toBe(true);
      });

      const replayProcessId = ProcessIdStub({ value: `replay-${sessionId}` });

      expect(proxy.getReplayHistoryMessage()).toStrictEqual({
        type: 'replay-history',
        sessionId,
        guildId,
        chatProcessId: replayProcessId,
      });
    });
  });

  describe('readOnly chat panel', () => {
    it('VALID: {entries pre-loaded} => ChatPanelWidget rendered without chat input', async () => {
      const proxy = SessionViewWidgetProxy();
      const sessionId = SessionIdStub({ value: 'f47ac10b-58cc-4372-a567-0e02b2c3d479' });
      proxy.setupGuilds({
        guilds: [
          GuildListItemStub({
            id: 'f47ac10b-58cc-4372-a567-0e02b2c3d479',
            urlSlug: 'my-guild' as never,
          }),
        ],
      });

      mantineRenderAdapter({
        ui: (
          <MemoryRouter initialEntries={[`/my-guild/session/${sessionId}`]}>
            <Routes>
              <Route path="/:guildSlug/session/:sessionId" element={<SessionViewWidget />} />
            </Routes>
          </MemoryRouter>
        ),
      });

      await waitFor(() => {
        expect(screen.getByTestId('dumpster-raccoon-widget')).toBeInTheDocument();
      });

      act(() => {
        proxy.setupConnectedChannel();
      });

      const replayProcessId = ProcessIdStub({ value: `replay-${sessionId}` });

      await waitFor(() => {
        expect(proxy.getReplayHistorySent()).toBe(true);
      });

      act(() => {
        proxy.deliverWsMessage({
          data: JSON.stringify({
            type: 'chat-output',
            payload: {
              chatProcessId: replayProcessId,
              questId: QuestIdStub(),
              workItemId: QuestWorkItemIdStub(),
              entries: [
                {
                  role: 'assistant',
                  type: 'text',
                  content: 'replayed',
                  uuid: '00000000-0000-4000-8000-000000000001',
                  timestamp: '2025-01-01T00:00:00.000Z',
                },
              ],
            },
            timestamp: '2025-01-01T00:00:00.000Z',
          }),
        });
        proxy.deliverWsMessage({
          data: JSON.stringify({
            type: 'chat-history-complete',
            payload: { chatProcessId: replayProcessId },
            timestamp: '2025-01-01T00:00:00.000Z',
          }),
        });
      });

      await waitFor(() => {
        expect(screen.getByTestId('CHAT_PANEL')).toBeInTheDocument();
      });

      expect(screen.queryByTestId('CHAT_INPUT')).toBe(null);
    });
  });

  describe('delivered entry content', () => {
    it('VALID: {chat-output delivered over the WS} => #check-entry-lands-in-transcript the entry renders as a CHAT_MESSAGE carrying its own text, not just any CHAT_MESSAGE', async () => {
      const proxy = SessionViewWidgetProxy();
      const sessionId = SessionIdStub({ value: 'f47ac10b-58cc-4372-a567-0e02b2c3d479' });
      proxy.setupGuilds({
        guilds: [
          GuildListItemStub({
            id: 'f47ac10b-58cc-4372-a567-0e02b2c3d479',
            urlSlug: 'my-guild' as never,
          }),
        ],
      });

      mantineRenderAdapter({
        ui: (
          <MemoryRouter initialEntries={[`/my-guild/session/${sessionId}`]}>
            <Routes>
              <Route path="/:guildSlug/session/:sessionId" element={<SessionViewWidget />} />
            </Routes>
          </MemoryRouter>
        ),
      });

      await waitFor(() => {
        expect(screen.getByTestId('dumpster-raccoon-widget')).toBeInTheDocument();
      });

      act(() => {
        proxy.setupConnectedChannel();
      });

      const replayProcessId = ProcessIdStub({ value: `replay-${sessionId}` });

      await waitFor(() => {
        expect(proxy.getReplayHistorySent()).toBe(true);
      });

      act(() => {
        proxy.deliverWsMessage({
          data: JSON.stringify({
            type: 'chat-output',
            payload: {
              chatProcessId: replayProcessId,
              questId: QuestIdStub(),
              workItemId: QuestWorkItemIdStub(),
              entries: [
                {
                  role: 'assistant',
                  type: 'text',
                  content: 'SESSION_ENTRY_TEXT',
                  uuid: '00000000-0000-4000-8000-000000000002',
                  timestamp: '2025-01-01T00:00:00.000Z',
                },
              ],
            },
            timestamp: '2025-01-01T00:00:00.000Z',
          }),
        });
        proxy.deliverWsMessage({
          data: JSON.stringify({
            type: 'chat-history-complete',
            payload: { chatProcessId: replayProcessId },
            timestamp: '2025-01-01T00:00:00.000Z',
          }),
        });
      });

      await waitFor(() => {
        expect(screen.getByTestId('CHAT_PANEL')).toBeInTheDocument();
      });

      const messageTexts = screen
        .queryAllByTestId('CHAT_MESSAGE')
        .map((message) => String(message.textContent));
      const matchIdx = messageTexts.findIndex((text) => text.includes('SESSION_ENTRY_TEXT'));

      expect(matchIdx).toBe(0);
    });
  });

  describe('not found state', () => {
    it('EDGE: {chat-history-complete with no entries} => renders NOT_FOUND', async () => {
      const proxy = SessionViewWidgetProxy();
      const sessionId = SessionIdStub({ value: 'f47ac10b-58cc-4372-a567-0e02b2c3d479' });
      proxy.setupGuilds({
        guilds: [
          GuildListItemStub({
            id: 'f47ac10b-58cc-4372-a567-0e02b2c3d479',
            urlSlug: 'my-guild' as never,
          }),
        ],
      });

      mantineRenderAdapter({
        ui: (
          <MemoryRouter initialEntries={[`/my-guild/session/${sessionId}`]}>
            <Routes>
              <Route path="/:guildSlug/session/:sessionId" element={<SessionViewWidget />} />
            </Routes>
          </MemoryRouter>
        ),
      });

      await waitFor(() => {
        expect(screen.getByTestId('dumpster-raccoon-widget')).toBeInTheDocument();
      });

      act(() => {
        proxy.setupConnectedChannel();
      });

      const replayProcessId = ProcessIdStub({ value: `replay-${sessionId}` });

      await waitFor(() => {
        expect(proxy.getReplayHistorySent()).toBe(true);
      });

      act(() => {
        proxy.deliverWsMessage({
          data: JSON.stringify({
            type: 'chat-history-complete',
            payload: { chatProcessId: replayProcessId },
            timestamp: '2025-01-01T00:00:00.000Z',
          }),
        });
      });

      await waitFor(() => {
        expect(screen.getByTestId('NOT_FOUND')).toBeInTheDocument();
      });

      expect(screen.getByTestId('NOT_FOUND')).toBeInTheDocument();
    });
  });

  describe('subagent chain rendering', () => {
    it('VALID: {Task tool_use + one subagent line delivered} => #check-session-chain-renders proxy.hasSubagentChain() is true', async () => {
      const proxy = SessionViewWidgetProxy();
      const sessionId = SessionIdStub({ value: 'f47ac10b-58cc-4372-a567-0e02b2c3d479' });
      proxy.setupGuilds({
        guilds: [
          GuildListItemStub({
            id: 'f47ac10b-58cc-4372-a567-0e02b2c3d479',
            urlSlug: 'my-guild' as never,
          }),
        ],
      });

      mantineRenderAdapter({
        ui: (
          <MemoryRouter initialEntries={[`/my-guild/session/${sessionId}`]}>
            <Routes>
              <Route path="/:guildSlug/session/:sessionId" element={<SessionViewWidget />} />
            </Routes>
          </MemoryRouter>
        ),
      });

      await waitFor(() => {
        expect(screen.getByTestId('dumpster-raccoon-widget')).toBeInTheDocument();
      });

      act(() => {
        proxy.setupConnectedChannel();
      });

      const replayProcessId = ProcessIdStub({ value: `replay-${sessionId}` });

      await waitFor(() => {
        expect(proxy.getReplayHistorySent()).toBe(true);
      });

      const entries = [
        TaskToolUseChatEntryStub({
          agentId: 'agent-session',
          timestamp: '2026-09-10T10:00:00.000Z',
        }),
        AssistantTextChatEntryStub({
          content: 'sub working',
          source: 'subagent',
          agentId: 'agent-session',
        }),
      ];

      act(() => {
        proxy.deliverWsMessage({
          data: JSON.stringify({
            type: 'chat-output',
            payload: {
              chatProcessId: replayProcessId,
              questId: QuestIdStub(),
              workItemId: QuestWorkItemIdStub(),
              entries,
            },
            timestamp: '2025-01-01T00:00:00.000Z',
          }),
        });
        proxy.deliverWsMessage({
          data: JSON.stringify({
            type: 'chat-history-complete',
            payload: { chatProcessId: replayProcessId },
            timestamp: '2025-01-01T00:00:00.000Z',
          }),
        });
      });

      await waitFor(() => {
        expect(screen.getByTestId('CHAT_PANEL')).toBeInTheDocument();
      });

      expect(proxy.hasSubagentChain()).toBe(true);
    });

    it("VALID: {chain with a completion notification reporting durationMs: 270000} => #check-session-finished-figure proxy.getDurationTexts() toStrictEqual ['4m']", async () => {
      const proxy = SessionViewWidgetProxy();
      const sessionId = SessionIdStub({ value: 'f47ac10b-58cc-4372-a567-0e02b2c3d479' });
      proxy.setupGuilds({
        guilds: [
          GuildListItemStub({
            id: 'f47ac10b-58cc-4372-a567-0e02b2c3d479',
            urlSlug: 'my-guild' as never,
          }),
        ],
      });

      mantineRenderAdapter({
        ui: (
          <MemoryRouter initialEntries={[`/my-guild/session/${sessionId}`]}>
            <Routes>
              <Route path="/:guildSlug/session/:sessionId" element={<SessionViewWidget />} />
            </Routes>
          </MemoryRouter>
        ),
      });

      await waitFor(() => {
        expect(screen.getByTestId('dumpster-raccoon-widget')).toBeInTheDocument();
      });

      act(() => {
        proxy.setupConnectedChannel();
      });

      const replayProcessId = ProcessIdStub({ value: `replay-${sessionId}` });

      await waitFor(() => {
        expect(proxy.getReplayHistorySent()).toBe(true);
      });

      const entries = [
        TaskToolUseChatEntryStub({
          agentId: 'agent-session',
          timestamp: '2026-09-10T10:00:00.000Z',
        }),
        AssistantTextChatEntryStub({
          content: 'sub working',
          source: 'subagent',
          agentId: 'agent-session',
        }),
        TaskNotificationChatEntryStub({
          taskId: 'agent-session',
          status: 'completed',
          timestamp: '2026-09-10T10:04:30.000Z',
          durationMs: 270000,
        }),
      ];

      act(() => {
        proxy.deliverWsMessage({
          data: JSON.stringify({
            type: 'chat-output',
            payload: {
              chatProcessId: replayProcessId,
              questId: QuestIdStub(),
              workItemId: QuestWorkItemIdStub(),
              entries,
            },
            timestamp: '2025-01-01T00:00:00.000Z',
          }),
        });
        proxy.deliverWsMessage({
          data: JSON.stringify({
            type: 'chat-history-complete',
            payload: { chatProcessId: replayProcessId },
            timestamp: '2025-01-01T00:00:00.000Z',
          }),
        });
      });

      await waitFor(() => {
        expect(screen.getByTestId('CHAT_PANEL')).toBeInTheDocument();
      });

      expect(proxy.getDurationTexts()).toStrictEqual(['4m']);
    });

    it('VALID: {finished chain header} => #check-session-duration-same-test-id proxy.getDurationTestIds() carries subagent-chain-duration', async () => {
      const proxy = SessionViewWidgetProxy();
      const sessionId = SessionIdStub({ value: 'f47ac10b-58cc-4372-a567-0e02b2c3d479' });
      proxy.setupGuilds({
        guilds: [
          GuildListItemStub({
            id: 'f47ac10b-58cc-4372-a567-0e02b2c3d479',
            urlSlug: 'my-guild' as never,
          }),
        ],
      });

      mantineRenderAdapter({
        ui: (
          <MemoryRouter initialEntries={[`/my-guild/session/${sessionId}`]}>
            <Routes>
              <Route path="/:guildSlug/session/:sessionId" element={<SessionViewWidget />} />
            </Routes>
          </MemoryRouter>
        ),
      });

      await waitFor(() => {
        expect(screen.getByTestId('dumpster-raccoon-widget')).toBeInTheDocument();
      });

      act(() => {
        proxy.setupConnectedChannel();
      });

      const replayProcessId = ProcessIdStub({ value: `replay-${sessionId}` });

      await waitFor(() => {
        expect(proxy.getReplayHistorySent()).toBe(true);
      });

      const entries = [
        TaskToolUseChatEntryStub({
          agentId: 'agent-session',
          timestamp: '2026-09-10T10:00:00.000Z',
        }),
        AssistantTextChatEntryStub({
          content: 'sub working',
          source: 'subagent',
          agentId: 'agent-session',
        }),
        TaskNotificationChatEntryStub({
          taskId: 'agent-session',
          status: 'completed',
          timestamp: '2026-09-10T10:04:30.000Z',
          durationMs: 270000,
        }),
      ];

      act(() => {
        proxy.deliverWsMessage({
          data: JSON.stringify({
            type: 'chat-output',
            payload: {
              chatProcessId: replayProcessId,
              questId: QuestIdStub(),
              workItemId: QuestWorkItemIdStub(),
              entries,
            },
            timestamp: '2025-01-01T00:00:00.000Z',
          }),
        });
        proxy.deliverWsMessage({
          data: JSON.stringify({
            type: 'chat-history-complete',
            payload: { chatProcessId: replayProcessId },
            timestamp: '2025-01-01T00:00:00.000Z',
          }),
        });
      });

      await waitFor(() => {
        expect(screen.getByTestId('CHAT_PANEL')).toBeInTheDocument();
      });

      expect(proxy.getDurationTestIds()).toStrictEqual([null, null, 'subagent-chain-duration']);
    });

    it("VALID: {finished chain, second chat-history-complete with nothing new} => #session-frozen-duration proxy.getDurationTexts() is still ['4m']", async () => {
      const proxy = SessionViewWidgetProxy();
      const sessionId = SessionIdStub({ value: 'f47ac10b-58cc-4372-a567-0e02b2c3d479' });
      proxy.setupGuilds({
        guilds: [
          GuildListItemStub({
            id: 'f47ac10b-58cc-4372-a567-0e02b2c3d479',
            urlSlug: 'my-guild' as never,
          }),
        ],
      });

      mantineRenderAdapter({
        ui: (
          <MemoryRouter initialEntries={[`/my-guild/session/${sessionId}`]}>
            <Routes>
              <Route path="/:guildSlug/session/:sessionId" element={<SessionViewWidget />} />
            </Routes>
          </MemoryRouter>
        ),
      });

      await waitFor(() => {
        expect(screen.getByTestId('dumpster-raccoon-widget')).toBeInTheDocument();
      });

      act(() => {
        proxy.setupConnectedChannel();
      });

      const replayProcessId = ProcessIdStub({ value: `replay-${sessionId}` });

      await waitFor(() => {
        expect(proxy.getReplayHistorySent()).toBe(true);
      });

      const entries = [
        TaskToolUseChatEntryStub({
          agentId: 'agent-session',
          timestamp: '2026-09-10T10:00:00.000Z',
        }),
        AssistantTextChatEntryStub({
          content: 'sub working',
          source: 'subagent',
          agentId: 'agent-session',
        }),
        TaskNotificationChatEntryStub({
          taskId: 'agent-session',
          status: 'completed',
          timestamp: '2026-09-10T10:04:30.000Z',
          durationMs: 270000,
        }),
      ];

      act(() => {
        proxy.deliverWsMessage({
          data: JSON.stringify({
            type: 'chat-output',
            payload: {
              chatProcessId: replayProcessId,
              questId: QuestIdStub(),
              workItemId: QuestWorkItemIdStub(),
              entries,
            },
            timestamp: '2025-01-01T00:00:00.000Z',
          }),
        });
        proxy.deliverWsMessage({
          data: JSON.stringify({
            type: 'chat-history-complete',
            payload: { chatProcessId: replayProcessId },
            timestamp: '2025-01-01T00:00:00.000Z',
          }),
        });
      });

      await waitFor(() => {
        expect(screen.getByTestId('CHAT_PANEL')).toBeInTheDocument();
      });

      expect(proxy.getDurationTexts()).toStrictEqual(['4m']);

      act(() => {
        proxy.deliverWsMessage({
          data: JSON.stringify({
            type: 'chat-history-complete',
            payload: { chatProcessId: replayProcessId },
            timestamp: '2025-01-01T00:00:01.000Z',
          }),
        });
      });

      expect(proxy.getDurationTexts()).toStrictEqual(['4m']);
    });
  });
});
