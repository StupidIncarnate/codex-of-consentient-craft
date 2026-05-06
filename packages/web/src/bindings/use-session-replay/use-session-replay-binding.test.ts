import {
  GuildIdStub,
  QuestIdStub,
  QuestWorkItemIdStub,
  SessionIdStub,
} from '@dungeonmaster/shared/contracts';

import { testingLibraryActAdapter } from '../../adapters/testing-library/act/testing-library-act-adapter';
import { testingLibraryRenderHookAdapter } from '../../adapters/testing-library/render-hook/testing-library-render-hook-adapter';
import { testingLibraryWaitForAdapter } from '../../adapters/testing-library/wait-for/testing-library-wait-for-adapter';

import { useSessionReplayBinding } from './use-session-replay-binding';
import { useSessionReplayBindingProxy } from './use-session-replay-binding.proxy';

describe('useSessionReplayBinding', () => {
  describe('initial state', () => {
    it('EMPTY: {sessionId: null, guildId: null} => returns empty entries with isLoading true', () => {
      useSessionReplayBindingProxy();

      const { result } = testingLibraryRenderHookAdapter({
        renderCallback: () => useSessionReplayBinding({ sessionId: null, guildId: null }),
      });

      expect(result.current).toStrictEqual({
        entries: [],
        isLoading: true,
        sessionNotFound: false,
      });
    });
  });

  describe('replay-history on mount', () => {
    it('VALID: {sessionId, guildId} => sends replay-history with replay-<sessionId> chatProcessId', () => {
      const proxy = useSessionReplayBindingProxy();
      const sessionId = SessionIdStub({ value: 'f47ac10b-58cc-4372-a567-0e02b2c3d479' });
      const guildId = GuildIdStub();

      testingLibraryRenderHookAdapter({
        renderCallback: () => useSessionReplayBinding({ sessionId, guildId }),
      });

      expect(proxy.getSentWsMessages()).toStrictEqual([
        {
          type: 'replay-history',
          sessionId,
          guildId,
          chatProcessId: `replay-${sessionId}`,
        },
      ]);
    });

    it('EMPTY: {sessionId: null} => does not send replay-history', () => {
      const proxy = useSessionReplayBindingProxy();

      testingLibraryRenderHookAdapter({
        renderCallback: () => useSessionReplayBinding({ sessionId: null, guildId: GuildIdStub() }),
      });

      expect(proxy.getSentWsMessages()).toStrictEqual([]);
    });
  });

  describe('chat-output handling', () => {
    it('VALID: {chat-output for matching replay process} => appends entries', () => {
      const proxy = useSessionReplayBindingProxy();
      const sessionId = SessionIdStub({ value: 'f47ac10b-58cc-4372-a567-0e02b2c3d479' });
      const guildId = GuildIdStub();
      const entryUuid = '00000000-0000-4000-8000-000000000001';
      const entryTs = '2025-01-01T00:00:00.000Z';

      const { result } = testingLibraryRenderHookAdapter({
        renderCallback: () => useSessionReplayBinding({ sessionId, guildId }),
      });

      testingLibraryActAdapter({
        callback: () => {
          proxy.receiveWsMessage({
            data: JSON.stringify({
              type: 'chat-output',
              payload: {
                chatProcessId: `replay-${sessionId}`,
                questId: QuestIdStub(),
                workItemId: QuestWorkItemIdStub(),
                entries: [
                  {
                    role: 'assistant',
                    type: 'text',
                    content: 'replayed',
                    uuid: entryUuid,
                    timestamp: entryTs,
                  },
                ],
              },
              timestamp: '2025-01-01T00:00:00.000Z',
            }),
          });
        },
      });

      expect(result.current).toStrictEqual({
        entries: [
          {
            role: 'assistant',
            type: 'text',
            content: 'replayed',
            uuid: entryUuid,
            timestamp: entryTs,
          },
        ],
        isLoading: true,
        sessionNotFound: false,
      });
    });

    it('EDGE: {chat-output for different chatProcessId} => is ignored', () => {
      const proxy = useSessionReplayBindingProxy();
      const sessionId = SessionIdStub({ value: 'f47ac10b-58cc-4372-a567-0e02b2c3d479' });
      const guildId = GuildIdStub();

      const { result } = testingLibraryRenderHookAdapter({
        renderCallback: () => useSessionReplayBinding({ sessionId, guildId }),
      });

      testingLibraryActAdapter({
        callback: () => {
          proxy.receiveWsMessage({
            data: JSON.stringify({
              type: 'chat-output',
              payload: {
                chatProcessId: 'unrelated-proc-id',
                questId: QuestIdStub(),
                workItemId: QuestWorkItemIdStub(),
                entries: [{ role: 'assistant', type: 'text', content: 'noise' }],
              },
              timestamp: '2025-01-01T00:00:00.000Z',
            }),
          });
        },
      });

      expect(result.current).toStrictEqual({
        entries: [],
        isLoading: true,
        sessionNotFound: false,
      });
    });
  });

  describe('chat-history-complete handling', () => {
    it('VALID: {chat-history-complete after entries received} => isLoading false, sessionNotFound false', () => {
      const proxy = useSessionReplayBindingProxy();
      const sessionId = SessionIdStub({ value: 'f47ac10b-58cc-4372-a567-0e02b2c3d479' });
      const guildId = GuildIdStub();
      const entryUuid = '00000000-0000-4000-8000-000000000002';
      const entryTs = '2025-01-01T00:00:00.000Z';

      const { result } = testingLibraryRenderHookAdapter({
        renderCallback: () => useSessionReplayBinding({ sessionId, guildId }),
      });

      testingLibraryActAdapter({
        callback: () => {
          proxy.receiveWsMessage({
            data: JSON.stringify({
              type: 'chat-output',
              payload: {
                chatProcessId: `replay-${sessionId}`,
                questId: QuestIdStub(),
                workItemId: QuestWorkItemIdStub(),
                entries: [
                  {
                    role: 'assistant',
                    type: 'text',
                    content: 'replayed',
                    uuid: entryUuid,
                    timestamp: entryTs,
                  },
                ],
              },
              timestamp: '2025-01-01T00:00:00.000Z',
            }),
          });
          proxy.receiveWsMessage({
            data: JSON.stringify({
              type: 'chat-history-complete',
              payload: { chatProcessId: `replay-${sessionId}` },
              timestamp: '2025-01-01T00:00:00.000Z',
            }),
          });
        },
      });

      expect(result.current).toStrictEqual({
        entries: [
          {
            role: 'assistant',
            type: 'text',
            content: 'replayed',
            uuid: entryUuid,
            timestamp: entryTs,
          },
        ],
        isLoading: false,
        sessionNotFound: false,
      });
    });

    it('EDGE: {chat-history-complete with no entries received} => sessionNotFound true', () => {
      const proxy = useSessionReplayBindingProxy();
      const sessionId = SessionIdStub({ value: 'f47ac10b-58cc-4372-a567-0e02b2c3d479' });
      const guildId = GuildIdStub();

      const { result } = testingLibraryRenderHookAdapter({
        renderCallback: () => useSessionReplayBinding({ sessionId, guildId }),
      });

      testingLibraryActAdapter({
        callback: () => {
          proxy.receiveWsMessage({
            data: JSON.stringify({
              type: 'chat-history-complete',
              payload: { chatProcessId: `replay-${sessionId}` },
              timestamp: '2025-01-01T00:00:00.000Z',
            }),
          });
        },
      });

      expect(result.current).toStrictEqual({
        entries: [],
        isLoading: false,
        sessionNotFound: true,
      });
    });
  });

  describe('cleanup', () => {
    it('EDGE: {unmount} => closes WS connection', () => {
      const proxy = useSessionReplayBindingProxy();
      const sessionId = SessionIdStub();
      const guildId = GuildIdStub();

      const { unmount } = testingLibraryRenderHookAdapter({
        renderCallback: () => useSessionReplayBinding({ sessionId, guildId }),
      });

      const closeMock = proxy.getSocketClose();

      testingLibraryActAdapter({
        callback: () => {
          unmount();
        },
      });

      expect(closeMock).toHaveBeenCalledTimes(1);
    });
  });

  describe('reconnect during replay', () => {
    // Locks in the ws-channel-consolidation semantics: a reconnect mid-replay re-sends
    // replay-history on the new connection so streaming resumes.
    // Against current source this test is intentionally RED: requestSentRef guards
    // re-sending so the second replay-history is never sent on the new socket.
    it('VALID: {WS closes and reconnects mid-replay} => re-sends replay-history and resumes streaming', async () => {
      const proxy = useSessionReplayBindingProxy();
      const sessionId = SessionIdStub({ value: 'f47ac10b-58cc-4372-a567-0e02b2c3d479' });
      const guildId = GuildIdStub();
      const entryUuid1 = '00000000-0000-4000-8000-000000000010';
      const entryTs1 = '2025-01-01T00:00:00.000Z';
      const entryUuid2 = '00000000-0000-4000-8000-000000000011';
      const entryTs2 = '2025-01-02T00:00:00.000Z';

      const { result } = testingLibraryRenderHookAdapter({
        renderCallback: () => useSessionReplayBinding({ sessionId, guildId }),
      });

      // Wait for the initial replay-history send
      await testingLibraryWaitForAdapter({
        callback: () => {
          expect(proxy.getSentWsMessages()).toStrictEqual([
            {
              type: 'replay-history',
              sessionId,
              guildId,
              chatProcessId: `replay-${sessionId}`,
            },
          ]);
        },
      });

      // Deliver one chat-output to prime the state before the disconnect
      testingLibraryActAdapter({
        callback: () => {
          proxy.receiveWsMessage({
            data: JSON.stringify({
              type: 'chat-output',
              payload: {
                chatProcessId: `replay-${sessionId}`,
                questId: QuestIdStub(),
                workItemId: QuestWorkItemIdStub(),
                entries: [
                  {
                    role: 'assistant',
                    type: 'text',
                    content: 'first streamed entry',
                    uuid: entryUuid1,
                    timestamp: entryTs1,
                  },
                ],
              },
              timestamp: entryTs1,
            }),
          });
        },
      });

      // Simulate WS close + reconnect mid-replay.
      // Capture the current (first) socket before reconnect creates a second one.
      // getCurrentSocket() returns the last socket, which is socket[0] at this point.
      // Object.assign mutates readyState without inline structural type casts.
      const firstSocket = proxy.getCurrentSocket();

      testingLibraryActAdapter({
        callback: () => {
          proxy.triggerWsClose();
          Object.assign(firstSocket, { readyState: WebSocket.CLOSED });
          proxy.triggerWsReconnect();
          proxy.triggerWsOpen();
          // Re-mark closed: triggerOpen resets ALL sockets' readyState to OPEN
          Object.assign(firstSocket, { readyState: WebSocket.CLOSED });
        },
      });

      // Wait for the second replay-history on the new connection
      await testingLibraryWaitForAdapter({
        callback: () => {
          expect(proxy.getSentWsMessages()).toStrictEqual([
            {
              type: 'replay-history',
              sessionId,
              guildId,
              chatProcessId: `replay-${sessionId}`,
            },
            {
              type: 'replay-history',
              sessionId,
              guildId,
              chatProcessId: `replay-${sessionId}`,
            },
          ]);
        },
      });

      // Deliver a chat-output on the new connection; assert streaming resumed and
      // the pre-reconnect entry was retained (dedup by uuid)
      testingLibraryActAdapter({
        callback: () => {
          proxy.receiveWsMessage({
            data: JSON.stringify({
              type: 'chat-output',
              payload: {
                chatProcessId: `replay-${sessionId}`,
                questId: QuestIdStub(),
                workItemId: QuestWorkItemIdStub(),
                entries: [
                  {
                    role: 'assistant',
                    type: 'text',
                    content: 'resumed after reconnect',
                    uuid: entryUuid2,
                    timestamp: entryTs2,
                  },
                ],
              },
              timestamp: entryTs2,
            }),
          });
        },
      });

      expect(result.current).toStrictEqual({
        entries: [
          {
            role: 'assistant',
            type: 'text',
            content: 'first streamed entry',
            uuid: entryUuid1,
            timestamp: entryTs1,
          },
          {
            role: 'assistant',
            type: 'text',
            content: 'resumed after reconnect',
            uuid: entryUuid2,
            timestamp: entryTs2,
          },
        ],
        isLoading: true,
        sessionNotFound: false,
      });
    });
  });
});
