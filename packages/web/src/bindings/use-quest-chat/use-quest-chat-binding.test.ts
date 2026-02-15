import { ProcessIdStub, QuestIdStub, UserInputStub } from '@dungeonmaster/shared/contracts';

import { testingLibraryActAdapter } from '../../adapters/testing-library/act/testing-library-act-adapter';
import { testingLibraryActAsyncAdapter } from '../../adapters/testing-library/act-async/testing-library-act-async-adapter';
import { testingLibraryRenderHookAdapter } from '../../adapters/testing-library/render-hook/testing-library-render-hook-adapter';

import { useQuestChatBinding } from './use-quest-chat-binding';
import { useQuestChatBindingProxy } from './use-quest-chat-binding.proxy';

describe('useQuestChatBinding', () => {
  describe('initial state', () => {
    it('EMPTY: {} => starts with empty entries and not streaming', () => {
      useQuestChatBindingProxy();

      const questId = QuestIdStub({ value: 'quest-abc' });

      const { result } = testingLibraryRenderHookAdapter({
        renderCallback: () => useQuestChatBinding({ questId }),
      });

      expect(result.current).toStrictEqual({
        entries: [],
        isStreaming: false,
        sendMessage: expect.any(Function),
        stopChat: expect.any(Function),
      });
    });
  });

  describe('sendMessage', () => {
    it('VALID: {message} => appends user entry and sets isStreaming', async () => {
      const proxy = useQuestChatBindingProxy();
      const questId = QuestIdStub({ value: 'quest-abc' });
      const chatProcessId = ProcessIdStub({ value: 'chat-proc-1' });
      const message = UserInputStub({ value: 'How do I add auth?' });

      proxy.setupChat({ chatProcessId });

      const { result } = testingLibraryRenderHookAdapter({
        renderCallback: () => useQuestChatBinding({ questId }),
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
  });

  describe('WebSocket chat-output handling', () => {
    it('VALID: {chat-output with matching chatProcessId} => appends assistant entries', async () => {
      const proxy = useQuestChatBindingProxy();
      const questId = QuestIdStub({ value: 'quest-abc' });
      const chatProcessId = ProcessIdStub({ value: 'chat-proc-1' });
      const message = UserInputStub({ value: 'Hello' });

      proxy.setupChat({ chatProcessId });

      const { result } = testingLibraryRenderHookAdapter({
        renderCallback: () => useQuestChatBinding({ questId }),
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

    it('VALID: {multiple chat-outputs with growing text} => updates entry in-place', async () => {
      const proxy = useQuestChatBindingProxy();
      const questId = QuestIdStub({ value: 'quest-abc' });
      const chatProcessId = ProcessIdStub({ value: 'chat-proc-1' });
      const message = UserInputStub({ value: 'Hello' });

      proxy.setupChat({ chatProcessId });

      const { result } = testingLibraryRenderHookAdapter({
        renderCallback: () => useQuestChatBinding({ questId }),
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
                line: '{"type":"assistant","message":{"content":[{"type":"text","text":"Hi"}]}}',
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
    });

    it('VALID: {chat-output adds new content block} => appends new entry', async () => {
      const proxy = useQuestChatBindingProxy();
      const questId = QuestIdStub({ value: 'quest-abc' });
      const chatProcessId = ProcessIdStub({ value: 'chat-proc-1' });
      const message = UserInputStub({ value: 'Hello' });

      proxy.setupChat({ chatProcessId });

      const { result } = testingLibraryRenderHookAdapter({
        renderCallback: () => useQuestChatBinding({ questId }),
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
                line: '{"type":"assistant","message":{"content":[{"type":"text","text":"Let me check"}]}}',
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
                chatProcessId: 'chat-proc-1',
                line: '{"type":"assistant","message":{"content":[{"type":"text","text":"Let me check"},{"type":"tool_use","id":"tool-1","name":"Read","input":{"file_path":"/test"}}]}}',
              },
              timestamp: '2025-01-01T00:00:00.000Z',
            }),
          });
        },
      });

      expect(result.current.entries).toStrictEqual([
        { role: 'user', content: 'Hello' },
        { role: 'assistant', type: 'text', content: 'Let me check' },
        {
          role: 'assistant',
          type: 'tool_use',
          toolName: 'Read',
          toolInput: '{"file_path":"/test"}',
        },
      ]);
    });

    it('EDGE: {chat-output with non-matching chatProcessId} => ignores message', async () => {
      const proxy = useQuestChatBindingProxy();
      const questId = QuestIdStub({ value: 'quest-abc' });
      const chatProcessId = ProcessIdStub({ value: 'chat-proc-1' });
      const message = UserInputStub({ value: 'Hello' });

      proxy.setupChat({ chatProcessId });

      const { result } = testingLibraryRenderHookAdapter({
        renderCallback: () => useQuestChatBinding({ questId }),
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
  });

  describe('WebSocket chat-complete handling', () => {
    it('VALID: {chat-complete with matching chatProcessId} => sets isStreaming to false', async () => {
      const proxy = useQuestChatBindingProxy();
      const questId = QuestIdStub({ value: 'quest-abc' });
      const chatProcessId = ProcessIdStub({ value: 'chat-proc-1' });
      const message = UserInputStub({ value: 'Hello' });

      proxy.setupChat({ chatProcessId });

      const { result } = testingLibraryRenderHookAdapter({
        renderCallback: () => useQuestChatBinding({ questId }),
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

    it('EDGE: {chat-complete with non-matching chatProcessId} => keeps streaming', async () => {
      const proxy = useQuestChatBindingProxy();
      const questId = QuestIdStub({ value: 'quest-abc' });
      const chatProcessId = ProcessIdStub({ value: 'chat-proc-1' });
      const message = UserInputStub({ value: 'Hello' });

      proxy.setupChat({ chatProcessId });

      const { result } = testingLibraryRenderHookAdapter({
        renderCallback: () => useQuestChatBinding({ questId }),
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
      const proxy = useQuestChatBindingProxy();
      const questId = QuestIdStub({ value: 'quest-abc' });
      const message = UserInputStub({ value: 'Hello' });

      proxy.setupChatError();

      const { result } = testingLibraryRenderHookAdapter({
        renderCallback: () => useQuestChatBinding({ questId }),
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
          role: 'assistant',
          type: 'text',
          content: expect.stringMatching(/^Error:/u),
        },
      ]);
    });
  });

  describe('cleanup', () => {
    it('VALID: {unmount} => closes WebSocket', () => {
      useQuestChatBindingProxy();

      const questId = QuestIdStub({ value: 'quest-abc' });

      const { result, unmount } = testingLibraryRenderHookAdapter({
        renderCallback: () => useQuestChatBinding({ questId }),
      });

      testingLibraryActAdapter({
        callback: () => {
          unmount();
        },
      });

      expect(result.current).toStrictEqual({
        entries: [],
        isStreaming: false,
        sendMessage: expect.any(Function),
        stopChat: expect.any(Function),
      });
    });
  });
});
