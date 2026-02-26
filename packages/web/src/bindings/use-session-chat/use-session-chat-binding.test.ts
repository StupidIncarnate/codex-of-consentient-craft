import {
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
        linkedQuestId: null,
        chatProcessId: null,
        pendingClarification: null,
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

      proxy.setupSessionNew({ chatProcessId });

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

      proxy.setupSessionNew({ chatProcessId });

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

      proxy.setupSessionNew({ chatProcessId });

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

      proxy.setupSessionNew({ chatProcessId });

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

      proxy.setupSessionNew({ chatProcessId });

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

  describe('WebSocket clarification-request handling', () => {
    it('VALID: {clarification-request with matching chatProcessId and valid questions} => sets pendingClarification', async () => {
      const proxy = useSessionChatBindingProxy();
      const guildId = GuildIdStub({ value: 'f47ac10b-58cc-4372-a567-0e02b2c3d479' });
      const chatProcessId = ProcessIdStub({ value: 'chat-proc-1' });
      const message = UserInputStub({ value: 'Hello' });

      proxy.setupSessionNew({ chatProcessId });

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
              type: 'clarification-request',
              payload: {
                chatProcessId: 'chat-proc-1',
                questions: [
                  {
                    question: 'Which framework?',
                    header: 'Framework',
                    options: [
                      { label: 'React', description: 'Component-based' },
                      { label: 'Vue', description: 'Progressive' },
                    ],
                    multiSelect: false,
                  },
                ],
              },
              timestamp: '2025-01-01T00:00:00.000Z',
            }),
          });
        },
      });

      expect(result.current.pendingClarification).toStrictEqual({
        questions: [
          {
            question: 'Which framework?',
            header: 'Framework',
            options: [
              { label: 'React', description: 'Component-based' },
              { label: 'Vue', description: 'Progressive' },
            ],
            multiSelect: false,
          },
        ],
      });
    });

    it('EDGE: {clarification-request with non-matching chatProcessId} => ignores message', async () => {
      const proxy = useSessionChatBindingProxy();
      const guildId = GuildIdStub({ value: 'f47ac10b-58cc-4372-a567-0e02b2c3d479' });
      const chatProcessId = ProcessIdStub({ value: 'chat-proc-1' });
      const message = UserInputStub({ value: 'Hello' });

      proxy.setupSessionNew({ chatProcessId });

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
              type: 'clarification-request',
              payload: {
                chatProcessId: 'different-proc',
                questions: [
                  {
                    question: 'Which framework?',
                    header: 'Framework',
                    options: [{ label: 'React', description: 'Component-based' }],
                    multiSelect: false,
                  },
                ],
              },
              timestamp: '2025-01-01T00:00:00.000Z',
            }),
          });
        },
      });

      expect(result.current.pendingClarification).toBeNull();
    });

    it('EDGE: {clarification-request with invalid questions payload} => does not set pendingClarification', async () => {
      const proxy = useSessionChatBindingProxy();
      const guildId = GuildIdStub({ value: 'f47ac10b-58cc-4372-a567-0e02b2c3d479' });
      const chatProcessId = ProcessIdStub({ value: 'chat-proc-1' });
      const message = UserInputStub({ value: 'Hello' });

      proxy.setupSessionNew({ chatProcessId });

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
              type: 'clarification-request',
              payload: {
                chatProcessId: 'chat-proc-1',
                questions: 'not-an-array',
              },
              timestamp: '2025-01-01T00:00:00.000Z',
            }),
          });
        },
      });

      expect(result.current.pendingClarification).toBeNull();
    });

    it('VALID: {sendMessage after clarification-request} => clears pendingClarification', async () => {
      const proxy = useSessionChatBindingProxy();
      const guildId = GuildIdStub({ value: 'f47ac10b-58cc-4372-a567-0e02b2c3d479' });
      const chatProcessId = ProcessIdStub({ value: 'chat-proc-1' });
      const message = UserInputStub({ value: 'Hello' });

      proxy.setupSessionNew({ chatProcessId });

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
              type: 'clarification-request',
              payload: {
                chatProcessId: 'chat-proc-1',
                questions: [
                  {
                    question: 'Which framework?',
                    header: 'Framework',
                    options: [{ label: 'React', description: 'Component-based' }],
                    multiSelect: false,
                  },
                ],
              },
              timestamp: '2025-01-01T00:00:00.000Z',
            }),
          });
        },
      });

      expect(result.current.pendingClarification).toStrictEqual({
        questions: [
          {
            question: 'Which framework?',
            header: 'Framework',
            options: [{ label: 'React', description: 'Component-based' }],
            multiSelect: false,
          },
        ],
      });

      const secondMessage = UserInputStub({ value: 'React please' });

      await testingLibraryActAsyncAdapter({
        callback: async () => {
          result.current.sendMessage({ message: secondMessage });
          await new Promise((resolve) => {
            globalThis.setTimeout(resolve, 0);
          });
        },
      });

      expect(result.current.pendingClarification).toBeNull();
    });
  });

  describe('WebSocket chat-complete handling', () => {
    it('VALID: {chat-complete with matching chatProcessId} => sets isStreaming to false', async () => {
      const proxy = useSessionChatBindingProxy();
      const guildId = GuildIdStub({ value: 'f47ac10b-58cc-4372-a567-0e02b2c3d479' });
      const chatProcessId = ProcessIdStub({ value: 'chat-proc-1' });
      const message = UserInputStub({ value: 'Hello' });

      proxy.setupSessionNew({ chatProcessId });

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

      proxy.setupSessionNew({ chatProcessId });

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

      proxy.setupSessionNew({ chatProcessId });

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

    it('EDGE: {chat-complete with non-string sessionId} => does not update currentSessionId', async () => {
      const proxy = useSessionChatBindingProxy();
      const guildId = GuildIdStub({ value: 'f47ac10b-58cc-4372-a567-0e02b2c3d479' });
      const chatProcessId = ProcessIdStub({ value: 'chat-proc-1' });
      const message = UserInputStub({ value: 'Hello' });

      proxy.setupSessionNew({ chatProcessId });

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
                sessionId: 12345,
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

      proxy.setupSessionNew({ chatProcessId });

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

  describe('WebSocket chat-patch handling', () => {
    it('VALID: {chat-patch with matching toolUseId} => updates agentId on matching entry', async () => {
      const proxy = useSessionChatBindingProxy();
      const guildId = GuildIdStub({ value: 'f47ac10b-58cc-4372-a567-0e02b2c3d479' });
      const chatProcessId = ProcessIdStub({ value: 'chat-proc-1' });
      const message = UserInputStub({ value: 'Hello' });

      proxy.setupSessionNew({ chatProcessId });

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
                line: '{"type":"assistant","message":{"content":[{"type":"tool_use","id":"tool-abc-123","name":"Read","input":{"file_path":"/tmp/test.ts"}}]}}',
              },
              timestamp: '2025-01-01T00:00:00.000Z',
            }),
          });
        },
      });

      testingLibraryActAdapter({
        callback: () => {
          proxy.receiveWsMessage({
            data: JSON.stringify({
              type: 'chat-patch',
              payload: {
                toolUseId: 'tool-abc-123',
                agentId: 'codeweaver-agent',
              },
              timestamp: '2025-01-01T00:00:00.000Z',
            }),
          });
        },
      });

      expect(result.current.entries).toStrictEqual([
        { role: 'user', content: 'Hello' },
        {
          role: 'assistant',
          type: 'tool_use',
          toolUseId: 'tool-abc-123',
          toolName: 'Read',
          toolInput: '{"file_path":"/tmp/test.ts"}',
          agentId: 'codeweaver-agent',
        },
      ]);
    });

    it('EDGE: {chat-patch with non-matching toolUseId} => does not modify entries', async () => {
      const proxy = useSessionChatBindingProxy();
      const guildId = GuildIdStub({ value: 'f47ac10b-58cc-4372-a567-0e02b2c3d479' });
      const chatProcessId = ProcessIdStub({ value: 'chat-proc-1' });
      const message = UserInputStub({ value: 'Hello' });

      proxy.setupSessionNew({ chatProcessId });

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
                line: '{"type":"assistant","message":{"content":[{"type":"tool_use","id":"tool-abc-123","name":"Read","input":{"file_path":"/tmp/test.ts"}}]}}',
              },
              timestamp: '2025-01-01T00:00:00.000Z',
            }),
          });
        },
      });

      testingLibraryActAdapter({
        callback: () => {
          proxy.receiveWsMessage({
            data: JSON.stringify({
              type: 'chat-patch',
              payload: {
                toolUseId: 'non-existent-tool-id',
                agentId: 'codeweaver-agent',
              },
              timestamp: '2025-01-01T00:00:00.000Z',
            }),
          });
        },
      });

      expect(result.current.entries).toStrictEqual([
        { role: 'user', content: 'Hello' },
        {
          role: 'assistant',
          type: 'tool_use',
          toolUseId: 'tool-abc-123',
          toolName: 'Read',
          toolInput: '{"file_path":"/tmp/test.ts"}',
        },
      ]);
    });

    it('EDGE: {chat-patch with empty toolUseId} => ignores patch', async () => {
      const proxy = useSessionChatBindingProxy();
      const guildId = GuildIdStub({ value: 'f47ac10b-58cc-4372-a567-0e02b2c3d479' });
      const chatProcessId = ProcessIdStub({ value: 'chat-proc-1' });
      const message = UserInputStub({ value: 'Hello' });

      proxy.setupSessionNew({ chatProcessId });

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
                line: '{"type":"assistant","message":{"content":[{"type":"tool_use","id":"tool-abc-123","name":"Read","input":{"file_path":"/tmp/test.ts"}}]}}',
              },
              timestamp: '2025-01-01T00:00:00.000Z',
            }),
          });
        },
      });

      testingLibraryActAdapter({
        callback: () => {
          proxy.receiveWsMessage({
            data: JSON.stringify({
              type: 'chat-patch',
              payload: {
                toolUseId: '',
                agentId: 'codeweaver-agent',
              },
              timestamp: '2025-01-01T00:00:00.000Z',
            }),
          });
        },
      });

      expect(result.current.entries).toStrictEqual([
        { role: 'user', content: 'Hello' },
        {
          role: 'assistant',
          type: 'tool_use',
          toolUseId: 'tool-abc-123',
          toolName: 'Read',
          toolInput: '{"file_path":"/tmp/test.ts"}',
        },
      ]);
    });

    it('EDGE: {chat-patch with empty agentId} => ignores patch', async () => {
      const proxy = useSessionChatBindingProxy();
      const guildId = GuildIdStub({ value: 'f47ac10b-58cc-4372-a567-0e02b2c3d479' });
      const chatProcessId = ProcessIdStub({ value: 'chat-proc-1' });
      const message = UserInputStub({ value: 'Hello' });

      proxy.setupSessionNew({ chatProcessId });

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
                line: '{"type":"assistant","message":{"content":[{"type":"tool_use","id":"tool-abc-123","name":"Read","input":{"file_path":"/tmp/test.ts"}}]}}',
              },
              timestamp: '2025-01-01T00:00:00.000Z',
            }),
          });
        },
      });

      testingLibraryActAdapter({
        callback: () => {
          proxy.receiveWsMessage({
            data: JSON.stringify({
              type: 'chat-patch',
              payload: {
                toolUseId: 'tool-abc-123',
                agentId: '',
              },
              timestamp: '2025-01-01T00:00:00.000Z',
            }),
          });
        },
      });

      expect(result.current.entries).toStrictEqual([
        { role: 'user', content: 'Hello' },
        {
          role: 'assistant',
          type: 'tool_use',
          toolUseId: 'tool-abc-123',
          toolName: 'Read',
          toolInput: '{"file_path":"/tmp/test.ts"}',
        },
      ]);
    });
  });

  describe('WebSocket quest-session-linked handling', () => {
    it('VALID: {quest-session-linked with matching chatProcessId} => sets linkedQuestId', async () => {
      const proxy = useSessionChatBindingProxy();
      const guildId = GuildIdStub({ value: 'f47ac10b-58cc-4372-a567-0e02b2c3d479' });
      const chatProcessId = ProcessIdStub({ value: 'chat-proc-1' });
      const message = UserInputStub({ value: 'Hello' });

      proxy.setupSessionNew({ chatProcessId });

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
              type: 'quest-session-linked',
              payload: {
                chatProcessId: 'chat-proc-1',
                questId: 'a1b2c3d4-e5f6-7890-abcd-ef1234567890',
              },
              timestamp: '2025-01-01T00:00:00.000Z',
            }),
          });
        },
      });

      expect(result.current.linkedQuestId).toBe('a1b2c3d4-e5f6-7890-abcd-ef1234567890');
    });

    it('EDGE: {quest-session-linked with non-matching chatProcessId} => does not set linkedQuestId', async () => {
      const proxy = useSessionChatBindingProxy();
      const guildId = GuildIdStub({ value: 'f47ac10b-58cc-4372-a567-0e02b2c3d479' });
      const chatProcessId = ProcessIdStub({ value: 'chat-proc-1' });
      const message = UserInputStub({ value: 'Hello' });

      proxy.setupSessionNew({ chatProcessId });

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
              type: 'quest-session-linked',
              payload: {
                chatProcessId: 'different-proc',
                questId: 'a1b2c3d4-e5f6-7890-abcd-ef1234567890',
              },
              timestamp: '2025-01-01T00:00:00.000Z',
            }),
          });
        },
      });

      expect(result.current.linkedQuestId).toBeNull();
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
        linkedQuestId: null,
        chatProcessId: null,
        pendingClarification: null,
        sendMessage: expect.any(Function),
        stopChat: expect.any(Function),
      });
    });
  });

  describe('history loading via WebSocket replay', () => {
    it('VALID: {guildId + initialSessionId} => sends replay-history WS message on mount', () => {
      const proxy = useSessionChatBindingProxy();
      const guildId = GuildIdStub({ value: 'f47ac10b-58cc-4372-a567-0e02b2c3d479' });
      const sessionId = SessionIdStub({ value: 'session-initial-1' });

      testingLibraryRenderHookAdapter({
        renderCallback: () => useSessionChatBinding({ guildId, sessionId }),
      });

      const sentMessages = proxy.getSentWsMessages();

      expect(sentMessages).toStrictEqual([
        {
          type: 'replay-history',
          sessionId: 'session-initial-1',
          guildId: 'f47ac10b-58cc-4372-a567-0e02b2c3d479',
          chatProcessId: 'replay-session-initial-1',
        },
      ]);
    });

    it('VALID: {replay chat-output events} => appends entries via same chat-output handler', () => {
      const proxy = useSessionChatBindingProxy();
      const guildId = GuildIdStub({ value: 'f47ac10b-58cc-4372-a567-0e02b2c3d479' });
      const sessionId = SessionIdStub({ value: 'session-replay-1' });

      const { result } = testingLibraryRenderHookAdapter({
        renderCallback: () => useSessionChatBinding({ guildId, sessionId }),
      });

      testingLibraryActAdapter({
        callback: () => {
          proxy.receiveWsMessage({
            data: JSON.stringify({
              type: 'chat-output',
              payload: {
                chatProcessId: 'replay-session-replay-1',
                line: '{"type":"assistant","message":{"content":[{"type":"text","text":"Replayed answer"}]}}',
              },
              timestamp: '2025-01-01T00:00:00.000Z',
            }),
          });
        },
      });

      expect(result.current.entries).toStrictEqual([
        { role: 'assistant', type: 'text', content: 'Replayed answer' },
      ]);
    });

    it('VALID: {chat-history-complete} => clears replay chatProcessId', () => {
      const proxy = useSessionChatBindingProxy();
      const guildId = GuildIdStub({ value: 'f47ac10b-58cc-4372-a567-0e02b2c3d479' });
      const sessionId = SessionIdStub({ value: 'session-replay-done' });

      const { result } = testingLibraryRenderHookAdapter({
        renderCallback: () => useSessionChatBinding({ guildId, sessionId }),
      });

      testingLibraryActAdapter({
        callback: () => {
          proxy.receiveWsMessage({
            data: JSON.stringify({
              type: 'chat-output',
              payload: {
                chatProcessId: 'replay-session-replay-done',
                line: '{"type":"assistant","message":{"content":[{"type":"text","text":"Historic answer"}]}}',
              },
              timestamp: '2025-01-01T00:00:00.000Z',
            }),
          });
        },
      });

      testingLibraryActAdapter({
        callback: () => {
          proxy.receiveWsMessage({
            data: JSON.stringify({
              type: 'chat-history-complete',
              payload: {
                chatProcessId: 'replay-session-replay-done',
              },
              timestamp: '2025-01-01T00:00:00.000Z',
            }),
          });
        },
      });

      expect(result.current.currentSessionId).toBe('session-replay-done');
      expect(result.current.entries).toStrictEqual([
        { role: 'assistant', type: 'text', content: 'Historic answer' },
      ]);
    });

    it('EDGE: {chat-history-complete with non-matching chatProcessId} => does not clear replay chatProcessId', () => {
      const proxy = useSessionChatBindingProxy();
      const guildId = GuildIdStub({ value: 'f47ac10b-58cc-4372-a567-0e02b2c3d479' });
      const sessionId = SessionIdStub({ value: 'session-replay-mismatch' });

      const { result } = testingLibraryRenderHookAdapter({
        renderCallback: () => useSessionChatBinding({ guildId, sessionId }),
      });

      testingLibraryActAdapter({
        callback: () => {
          proxy.receiveWsMessage({
            data: JSON.stringify({
              type: 'chat-history-complete',
              payload: {
                chatProcessId: 'different-proc',
              },
              timestamp: '2025-01-01T00:00:00.000Z',
            }),
          });
        },
      });

      testingLibraryActAdapter({
        callback: () => {
          proxy.receiveWsMessage({
            data: JSON.stringify({
              type: 'chat-output',
              payload: {
                chatProcessId: 'replay-session-replay-mismatch',
                line: '{"type":"assistant","message":{"content":[{"type":"text","text":"Still works"}]}}',
              },
              timestamp: '2025-01-01T00:00:00.000Z',
            }),
          });
        },
      });

      expect(result.current.entries).toStrictEqual([
        { role: 'assistant', type: 'text', content: 'Still works' },
      ]);
    });

    it('EDGE: {guildId: null} => does not send replay-history', () => {
      const proxy = useSessionChatBindingProxy();

      testingLibraryRenderHookAdapter({
        renderCallback: () => useSessionChatBinding({ guildId: null }),
      });

      const sentMessages = proxy.getSentWsMessages();

      expect(sentMessages).toStrictEqual([]);
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
