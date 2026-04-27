import {
  GuildIdStub,
  GuildListItemStub,
  ProcessIdStub,
  QuestIdStub,
  QuestWorkItemIdStub,
  SessionIdStub,
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

      const replayProcessId = ProcessIdStub({ value: `replay-${sessionId}` });

      await waitFor(() => {
        expect(proxy.getReplayHistorySent()).toBe(true);
      });

      act(() => {
        proxy.receiveWsMessage({
          data: JSON.stringify({
            type: 'chat-output',
            payload: {
              chatProcessId: replayProcessId,
              questId: QuestIdStub(),
              workItemId: QuestWorkItemIdStub(),
              entries: [{ role: 'assistant', type: 'text', content: 'replayed' }],
            },
            timestamp: '2025-01-01T00:00:00.000Z',
          }),
        });
        proxy.receiveWsMessage({
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

      const replayProcessId = ProcessIdStub({ value: `replay-${sessionId}` });

      await waitFor(() => {
        expect(proxy.getReplayHistorySent()).toBe(true);
      });

      act(() => {
        proxy.receiveWsMessage({
          data: JSON.stringify({
            type: 'chat-output',
            payload: {
              chatProcessId: replayProcessId,
              questId: QuestIdStub(),
              workItemId: QuestWorkItemIdStub(),
              entries: [{ role: 'assistant', type: 'text', content: 'replayed' }],
            },
            timestamp: '2025-01-01T00:00:00.000Z',
          }),
        });
        proxy.receiveWsMessage({
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

      const replayProcessId = ProcessIdStub({ value: `replay-${sessionId}` });

      await waitFor(() => {
        expect(proxy.getReplayHistorySent()).toBe(true);
      });

      act(() => {
        proxy.receiveWsMessage({
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
});
