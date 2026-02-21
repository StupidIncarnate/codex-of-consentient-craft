import {
  ChatSessionStub,
  GuildIdStub,
  ProcessIdStub,
  SessionIdStub,
  UserInputStub,
} from '@dungeonmaster/shared/contracts';

import { testingLibraryActAdapter } from '../../adapters/testing-library/act/testing-library-act-adapter';
import { testingLibraryActAsyncAdapter } from '../../adapters/testing-library/act-async/testing-library-act-async-adapter';
import { testingLibraryRenderHookAdapter } from '../../adapters/testing-library/render-hook/testing-library-render-hook-adapter';

import { useSessionChatBinding } from './use-session-chat-binding';
import { useSessionChatBindingProxy } from './use-session-chat-binding.proxy';

describe('useSessionChatBinding', () => {
  describe('initial state', () => {
    it('EMPTY: {guildId: null} => starts with empty entries and not streaming', () => {
      useSessionChatBindingProxy();

      const { result } = testingLibraryRenderHookAdapter({
        renderCallback: () => useSessionChatBinding({ guildId: null }),
      });

      expect(result.current).toStrictEqual({
        entries: [],
        isStreaming: false,
        currentSessionId: null,
        sendMessage: expect.any(Function),
        stopChat: expect.any(Function),
      });
    });
  });

  describe('sendMessage', () => {
    it('VALID: {guildId, message} => appends user entry and sets isStreaming', async () => {
      const proxy = useSessionChatBindingProxy();
      const guildId = GuildIdStub({ value: 'f47ac10b-58cc-4372-a567-0e02b2c3d479' });
      const chatProcessId = ProcessIdStub({ value: 'chat-proc-1' });
      const message = UserInputStub({ value: 'How do I add auth?' });

      proxy.setupGuildChat({ chatProcessId });

      const { result } = testingLibraryRenderHookAdapter({
        renderCallback: () => useSessionChatBinding({ guildId }),
      });

      await testingLibraryActAsyncAdapter({
        callback: async () => {
          result.current.sendMessage({ message });
          await new Promise((resolve) => {
            globalThis.setTimeout(resolve, 0);
          });
        },
      });

      expect(result.current.entries).toStrictEqual([
        { role: 'user', content: 'How do I add auth?' },
      ]);
      expect(result.current.isStreaming).toBe(true);
    });

    it('VALID: {guildId, message, existing sessionId} => sends via session endpoint', async () => {
      const proxy = useSessionChatBindingProxy();
      const guildId = GuildIdStub({ value: 'f47ac10b-58cc-4372-a567-0e02b2c3d479' });
      const sessionId = SessionIdStub({ value: 'session-existing-1' });
      const chatProcessId = ProcessIdStub({ value: 'chat-proc-session' });
      const message = UserInputStub({ value: 'Continue' });

      proxy.setupSessionChat({ chatProcessId });

      const { result } = testingLibraryRenderHookAdapter({
        renderCallback: () => useSessionChatBinding({ guildId, sessionId }),
      });

      await testingLibraryActAsyncAdapter({
        callback: async () => {
          result.current.sendMessage({ message });
          await new Promise((resolve) => {
            globalThis.setTimeout(resolve, 0);
          });
        },
      });

      expect(result.current.entries).toStrictEqual([{ role: 'user', content: 'Continue' }]);
      expect(result.current.isStreaming).toBe(true);
    });

    it('EMPTY: {guildId: null} => sendMessage does not call broker', async () => {
      useSessionChatBindingProxy();
      const message = UserInputStub({ value: 'No target' });

      const { result } = testingLibraryRenderHookAdapter({
        renderCallback: () => useSessionChatBinding({ guildId: null }),
      });

      await testingLibraryActAsyncAdapter({
        callback: async () => {
          result.current.sendMessage({ message });
          await new Promise((resolve) => {
            globalThis.setTimeout(resolve, 0);
          });
        },
      });

      expect(result.current.entries).toStrictEqual([]);
      expect(result.current.isStreaming).toBe(false);
    });
  });

  describe('WebSocket chat-output handling', () => {
    it('VALID: {chat-output with matching chatProcessId} => appends assistant entries', async () => {
      const proxy = useSessionChatBindingProxy();
      const guildId = GuildIdStub({ value: 'f47ac10b-58cc-4372-a567-0e02b2c3d479' });
      const chatProcessId = ProcessIdStub({ value: 'chat-proc-1' });
      const message = UserInputStub({ value: 'Hello' });

      proxy.setupGuildChat({ chatProcessId });

      const { result } = testingLibraryRenderHookAdapter({
        renderCallback: () => useSessionChatBinding({ guildId }),
      });

      await testingLibraryActAsyncAdapter({
        callback: async () => {
          result.current.sendMessage({ message });
          await new Promise((resolve) => {
            globalThis.setTimeout(resolve, 0);
          });
        },
      });

      testingLibraryActAdapter({
        callback: () => {
          proxy.receiveWsMessage({
            data: JSON.stringify({
              type: 'chat-output',
              payload: {
                chatProcessId: 'chat-proc-1',
                line: '{"type":"assistant","message":{"content":[{"type":"text","text":"Hi there"}]}}',
              },
              timestamp: '2025-01-01T00:00:00.000Z',
            }),
          });
        },
      });

      expect(result.current.entries).toStrictEqual([
        { role: 'user', content: 'Hello' },
        { role: 'assistant', type: 'text', content: 'Hi there' },
      ]);
      expect(result.current.isStreaming).toBe(true);
    });

    it('EDGE: {chat-output with non-matching chatProcessId} => ignores message', async () => {
      const proxy = useSessionChatBindingProxy();
      const guildId = GuildIdStub({ value: 'f47ac10b-58cc-4372-a567-0e02b2c3d479' });
      const chatProcessId = ProcessIdStub({ value: 'chat-proc-1' });
      const message = UserInputStub({ value: 'Hello' });

      proxy.setupGuildChat({ chatProcessId });

      const { result } = testingLibraryRenderHookAdapter({
        renderCallback: () => useSessionChatBinding({ guildId }),
      });

      await testingLibraryActAsyncAdapter({
        callback: async () => {
          result.current.sendMessage({ message });
          await new Promise((resolve) => {
            globalThis.setTimeout(resolve, 0);
          });
        },
      });

      testingLibraryActAdapter({
        callback: () => {
          proxy.receiveWsMessage({
            data: JSON.stringify({
              type: 'chat-output',
              payload: {
                chatProcessId: 'different-proc',
                line: '{"type":"assistant","message":{"content":[{"type":"text","text":"wrong"}]}}',
              },
              timestamp: '2025-01-01T00:00:00.000Z',
            }),
          });
        },
      });

      expect(result.current.entries).toStrictEqual([{ role: 'user', content: 'Hello' }]);
    });

    it('VALID: {chat-output with sessionId in result} => updates currentSessionId', async () => {
      const proxy = useSessionChatBindingProxy();
      const guildId = GuildIdStub({ value: 'f47ac10b-58cc-4372-a567-0e02b2c3d479' });
      const chatProcessId = ProcessIdStub({ value: 'chat-proc-1' });
      const message = UserInputStub({ value: 'Hello' });

      proxy.setupGuildChat({ chatProcessId });

      const { result } = testingLibraryRenderHookAdapter({
        renderCallback: () => useSessionChatBinding({ guildId }),
      });

      await testingLibraryActAsyncAdapter({
        callback: async () => {
          result.current.sendMessage({ message });
          await new Promise((resolve) => {
            globalThis.setTimeout(resolve, 0);
          });
        },
      });

      testingLibraryActAdapter({
        callback: () => {
          proxy.receiveWsMessage({
            data: JSON.stringify({
              type: 'chat-output',
              payload: {
                chatProcessId: 'chat-proc-1',
                line: '{"type":"system","subtype":"init","session_id":"new-session-id"}',
              },
              timestamp: '2025-01-01T00:00:00.000Z',
            }),
          });
        },
      });

      expect(result.current.currentSessionId).toBe('new-session-id');
    });

    it('EDGE: {chat-output with non-string line} => ignores message', async () => {
      const proxy = useSessionChatBindingProxy();
      const guildId = GuildIdStub({ value: 'f47ac10b-58cc-4372-a567-0e02b2c3d479' });
      const chatProcessId = ProcessIdStub({ value: 'chat-proc-1' });
      const message = UserInputStub({ value: 'Hello' });

      proxy.setupGuildChat({ chatProcessId });

      const { result } = testingLibraryRenderHookAdapter({
        renderCallback: () => useSessionChatBinding({ guildId }),
      });

      await testingLibraryActAsyncAdapter({
        callback: async () => {
          result.current.sendMessage({ message });
          await new Promise((resolve) => {
            globalThis.setTimeout(resolve, 0);
          });
        },
      });

      testingLibraryActAdapter({
        callback: () => {
          proxy.receiveWsMessage({
            data: JSON.stringify({
              type: 'chat-output',
              payload: {
                chatProcessId: 'chat-proc-1',
              },
              timestamp: '2025-01-01T00:00:00.000Z',
            }),
          });
        },
      });

      expect(result.current.entries).toStrictEqual([{ role: 'user', content: 'Hello' }]);
    });

    it('EDGE: {invalid WebSocket message} => ignores message', () => {
      const proxy = useSessionChatBindingProxy();
      const guildId = GuildIdStub({ value: 'f47ac10b-58cc-4372-a567-0e02b2c3d479' });

      const { result } = testingLibraryRenderHookAdapter({
        renderCallback: () => useSessionChatBinding({ guildId }),
      });

      testingLibraryActAdapter({
        callback: () => {
          proxy.receiveWsMessage({
            data: JSON.stringify({ invalid: 'not-a-valid-ws-message' }),
          });
        },
      });

      expect(result.current.entries).toStrictEqual([]);
      expect(result.current.isStreaming).toBe(false);
    });
  });

  describe('WebSocket chat-complete handling', () => {
    it('VALID: {chat-complete with matching chatProcessId} => sets isStreaming to false', async () => {
      const proxy = useSessionChatBindingProxy();
      const guildId = GuildIdStub({ value: 'f47ac10b-58cc-4372-a567-0e02b2c3d479' });
      const chatProcessId = ProcessIdStub({ value: 'chat-proc-1' });
      const message = UserInputStub({ value: 'Hello' });

      proxy.setupGuildChat({ chatProcessId });

      const { result } = testingLibraryRenderHookAdapter({
        renderCallback: () => useSessionChatBinding({ guildId }),
      });

      await testingLibraryActAsyncAdapter({
        callback: async () => {
          result.current.sendMessage({ message });
          await new Promise((resolve) => {
            globalThis.setTimeout(resolve, 0);
          });
        },
      });

      expect(result.current.isStreaming).toBe(true);

      testingLibraryActAdapter({
        callback: () => {
          proxy.receiveWsMessage({
            data: JSON.stringify({
              type: 'chat-complete',
              payload: {
                chatProcessId: 'chat-proc-1',
                sessionId: 'session-xyz',
              },
              timestamp: '2025-01-01T00:00:00.000Z',
            }),
          });
        },
      });

      expect(result.current.isStreaming).toBe(false);
    });

    it('VALID: {chat-complete with sessionId} => updates currentSessionId', async () => {
      const proxy = useSessionChatBindingProxy();
      const guildId = GuildIdStub({ value: 'f47ac10b-58cc-4372-a567-0e02b2c3d479' });
      const chatProcessId = ProcessIdStub({ value: 'chat-proc-1' });
      const message = UserInputStub({ value: 'Hello' });

      proxy.setupGuildChat({ chatProcessId });

      const { result } = testingLibraryRenderHookAdapter({
        renderCallback: () => useSessionChatBinding({ guildId }),
      });

      await testingLibraryActAsyncAdapter({
        callback: async () => {
          result.current.sendMessage({ message });
          await new Promise((resolve) => {
            globalThis.setTimeout(resolve, 0);
          });
        },
      });

      testingLibraryActAdapter({
        callback: () => {
          proxy.receiveWsMessage({
            data: JSON.stringify({
              type: 'chat-complete',
              payload: {
                chatProcessId: 'chat-proc-1',
                sessionId: 'completed-session-id',
              },
              timestamp: '2025-01-01T00:00:00.000Z',
            }),
          });
        },
      });

      expect(result.current.currentSessionId).toBe('completed-session-id');
      expect(result.current.isStreaming).toBe(false);
    });

    it('EDGE: {chat-complete with empty sessionId} => does not update currentSessionId', async () => {
      const proxy = useSessionChatBindingProxy();
      const guildId = GuildIdStub({ value: 'f47ac10b-58cc-4372-a567-0e02b2c3d479' });
      const chatProcessId = ProcessIdStub({ value: 'chat-proc-1' });
      const message = UserInputStub({ value: 'Hello' });

      proxy.setupGuildChat({ chatProcessId });

      const { result } = testingLibraryRenderHookAdapter({
        renderCallback: () => useSessionChatBinding({ guildId }),
      });

      await testingLibraryActAsyncAdapter({
        callback: async () => {
          result.current.sendMessage({ message });
          await new Promise((resolve) => {
            globalThis.setTimeout(resolve, 0);
          });
        },
      });

      testingLibraryActAdapter({
        callback: () => {
          proxy.receiveWsMessage({
            data: JSON.stringify({
              type: 'chat-complete',
              payload: {
                chatProcessId: 'chat-proc-1',
                sessionId: '',
              },
              timestamp: '2025-01-01T00:00:00.000Z',
            }),
          });
        },
      });

      expect(result.current.currentSessionId).toBeNull();
      expect(result.current.isStreaming).toBe(false);
    });

    it('EDGE: {chat-complete with non-matching chatProcessId} => keeps streaming', async () => {
      const proxy = useSessionChatBindingProxy();
      const guildId = GuildIdStub({ value: 'f47ac10b-58cc-4372-a567-0e02b2c3d479' });
      const chatProcessId = ProcessIdStub({ value: 'chat-proc-1' });
      const message = UserInputStub({ value: 'Hello' });

      proxy.setupGuildChat({ chatProcessId });

      const { result } = testingLibraryRenderHookAdapter({
        renderCallback: () => useSessionChatBinding({ guildId }),
      });

      await testingLibraryActAsyncAdapter({
        callback: async () => {
          result.current.sendMessage({ message });
          await new Promise((resolve) => {
            globalThis.setTimeout(resolve, 0);
          });
        },
      });

      testingLibraryActAdapter({
        callback: () => {
          proxy.receiveWsMessage({
            data: JSON.stringify({
              type: 'chat-complete',
              payload: {
                chatProcessId: 'different-proc',
                sessionId: 'session-xyz',
              },
              timestamp: '2025-01-01T00:00:00.000Z',
            }),
          });
        },
      });

      expect(result.current.isStreaming).toBe(true);
    });
  });

  describe('error handling', () => {
    it('ERROR: {broker fails} => sets isStreaming false and appends error entry', async () => {
      const proxy = useSessionChatBindingProxy();
      const guildId = GuildIdStub({ value: 'f47ac10b-58cc-4372-a567-0e02b2c3d479' });
      const message = UserInputStub({ value: 'Hello' });

      proxy.setupChatError();

      const { result } = testingLibraryRenderHookAdapter({
        renderCallback: () => useSessionChatBinding({ guildId }),
      });

      await testingLibraryActAsyncAdapter({
        callback: async () => {
          result.current.sendMessage({ message });
          await new Promise((resolve) => {
            globalThis.setTimeout(resolve, 0);
          });
        },
      });

      expect(result.current.isStreaming).toBe(false);
      expect(result.current.entries).toStrictEqual([
        { role: 'user', content: 'Hello' },
        {
          role: 'system',
          type: 'error',
          content: expect.any(String),
        },
      ]);
    });
  });

  describe('cleanup', () => {
    it('VALID: {unmount} => closes WebSocket', () => {
      useSessionChatBindingProxy();

      const guildId = GuildIdStub({ value: 'f47ac10b-58cc-4372-a567-0e02b2c3d479' });

      const { result, unmount } = testingLibraryRenderHookAdapter({
        renderCallback: () => useSessionChatBinding({ guildId }),
      });

      testingLibraryActAdapter({
        callback: () => {
          unmount();
        },
      });

      expect(result.current).toStrictEqual({
        entries: [],
        isStreaming: false,
        currentSessionId: null,
        sendMessage: expect.any(Function),
        stopChat: expect.any(Function),
      });
    });
  });

  describe('history loading', () => {
    it('VALID: {guildId + chatSessions with active session} => loads history on mount', async () => {
      const proxy = useSessionChatBindingProxy();
      const guildId = GuildIdStub({ value: 'f47ac10b-58cc-4372-a567-0e02b2c3d479' });
      const sessionId = SessionIdStub({ value: 'session-active-1' });
      const chatSessions = [ChatSessionStub({ sessionId, active: true })];

      proxy.setupHistory({
        entries: [
          { type: 'user', message: { role: 'user', content: 'Previous question' } },
          {
            type: 'assistant',
            message: { content: [{ type: 'text', text: 'Previous answer' }] },
          },
        ],
      });

      const { result } = testingLibraryRenderHookAdapter({
        renderCallback: () => useSessionChatBinding({ guildId, chatSessions }),
      });

      await testingLibraryActAsyncAdapter({
        callback: async () => {
          await new Promise((resolve) => {
            globalThis.setTimeout(resolve, 0);
          });
        },
      });

      expect(result.current.entries).toStrictEqual([
        { role: 'user', content: 'Previous question' },
        { role: 'assistant', type: 'text', content: 'Previous answer' },
      ]);
    });

    it('VALID: {guildId + initialSessionId} => loads history using initialSessionId', async () => {
      const proxy = useSessionChatBindingProxy();
      const guildId = GuildIdStub({ value: 'f47ac10b-58cc-4372-a567-0e02b2c3d479' });
      const sessionId = SessionIdStub({ value: 'session-initial-1' });

      proxy.setupHistory({
        entries: [{ type: 'user', message: { role: 'user', content: 'Pinned question' } }],
      });

      const { result } = testingLibraryRenderHookAdapter({
        renderCallback: () => useSessionChatBinding({ guildId, sessionId }),
      });

      await testingLibraryActAsyncAdapter({
        callback: async () => {
          await new Promise((resolve) => {
            globalThis.setTimeout(resolve, 0);
          });
        },
      });

      expect(result.current.currentSessionId).toBe('session-initial-1');
      expect(result.current.entries).toStrictEqual([{ role: 'user', content: 'Pinned question' }]);
    });

    it('EDGE: {history returns empty entries} => does not set entries', async () => {
      const proxy = useSessionChatBindingProxy();
      const guildId = GuildIdStub({ value: 'f47ac10b-58cc-4372-a567-0e02b2c3d479' });
      const sessionId = SessionIdStub({ value: 'session-empty-history' });

      proxy.setupHistory({ entries: [] });

      const { result } = testingLibraryRenderHookAdapter({
        renderCallback: () => useSessionChatBinding({ guildId, sessionId }),
      });

      await testingLibraryActAsyncAdapter({
        callback: async () => {
          await new Promise((resolve) => {
            globalThis.setTimeout(resolve, 0);
          });
        },
      });

      expect(result.current.entries).toStrictEqual([]);
      expect(result.current.currentSessionId).toBe('session-empty-history');
    });

    it('EDGE: {guildId: null} => does not load history', async () => {
      useSessionChatBindingProxy();

      const { result } = testingLibraryRenderHookAdapter({
        renderCallback: () => useSessionChatBinding({ guildId: null }),
      });

      await testingLibraryActAsyncAdapter({
        callback: async () => {
          await new Promise((resolve) => {
            globalThis.setTimeout(resolve, 0);
          });
        },
      });

      expect(result.current.entries).toStrictEqual([]);
    });

    it('EDGE: {chatSessions with no active session} => does not load history', async () => {
      useSessionChatBindingProxy();
      const guildId = GuildIdStub({ value: 'f47ac10b-58cc-4372-a567-0e02b2c3d479' });
      const chatSessions = [ChatSessionStub({ active: false })];

      const { result } = testingLibraryRenderHookAdapter({
        renderCallback: () => useSessionChatBinding({ guildId, chatSessions }),
      });

      await testingLibraryActAsyncAdapter({
        callback: async () => {
          await new Promise((resolve) => {
            globalThis.setTimeout(resolve, 0);
          });
        },
      });

      expect(result.current.entries).toStrictEqual([]);
    });

    it('EDGE: {empty chatSessions} => does not load history', async () => {
      useSessionChatBindingProxy();
      const guildId = GuildIdStub({ value: 'f47ac10b-58cc-4372-a567-0e02b2c3d479' });
      const chatSessions: ReturnType<typeof ChatSessionStub>[] = [];

      const { result } = testingLibraryRenderHookAdapter({
        renderCallback: () => useSessionChatBinding({ guildId, chatSessions }),
      });

      await testingLibraryActAsyncAdapter({
        callback: async () => {
          await new Promise((resolve) => {
            globalThis.setTimeout(resolve, 0);
          });
        },
      });

      expect(result.current.entries).toStrictEqual([]);
    });
  });

  describe('initial state with sessionId', () => {
    it('VALID: {sessionId provided} => sets currentSessionId on mount', () => {
      useSessionChatBindingProxy();
      const guildId = GuildIdStub({ value: 'f47ac10b-58cc-4372-a567-0e02b2c3d479' });
      const sessionId = SessionIdStub({ value: 'session-init-id' });

      const { result } = testingLibraryRenderHookAdapter({
        renderCallback: () => useSessionChatBinding({ guildId, sessionId }),
      });

      expect(result.current.currentSessionId).toBe('session-init-id');
    });
  });
});
