import { SessionIdStub, AbsoluteFilePathStub } from '@dungeonmaster/shared/contracts';

import { sessionChatHistoryBroker } from './session-chat-history-broker';
import { sessionChatHistoryBrokerProxy } from './session-chat-history-broker.proxy';

describe('sessionChatHistoryBroker', () => {
  describe('chat history reading', () => {
    it('VALID: {session with user and assistant entries} => returns filtered entries', async () => {
      const proxy = sessionChatHistoryBrokerProxy();
      const sessionId = SessionIdStub({ value: 'test-session-1' });
      const projectPath = AbsoluteFilePathStub({ value: '/home/user/my-project' });
      const homeDir = AbsoluteFilePathStub({ value: '/home/user' });

      proxy.setupMainEntries({
        content:
          '{"type":"user","timestamp":"2025-01-01T00:00:00Z","message":"hello"}\n{"type":"assistant","timestamp":"2025-01-01T00:00:01Z","message":"hi"}\n{"type":"system","timestamp":"2025-01-01T00:00:02Z","message":"init"}',
      });
      proxy.setupSubagentDirMissing();

      const result = await sessionChatHistoryBroker({ sessionId, projectPath, homeDir });

      expect(result).toHaveLength(2);
    });

    it('EMPTY: {no user or assistant entries} => returns empty array', async () => {
      const proxy = sessionChatHistoryBrokerProxy();
      const sessionId = SessionIdStub({ value: 'test-session-2' });
      const projectPath = AbsoluteFilePathStub({ value: '/home/user/my-project' });
      const homeDir = AbsoluteFilePathStub({ value: '/home/user' });

      proxy.setupMainEntries({
        content: '{"type":"system","timestamp":"2025-01-01T00:00:00Z"}',
      });
      proxy.setupSubagentDirMissing();

      const result = await sessionChatHistoryBroker({ sessionId, projectPath, homeDir });

      expect(result).toStrictEqual([]);
    });

    it('VALID: {session with subagent entries} => merges and sorts by timestamp', async () => {
      const proxy = sessionChatHistoryBrokerProxy();
      const sessionId = SessionIdStub({ value: 'test-session-3' });
      const projectPath = AbsoluteFilePathStub({ value: '/home/user/my-project' });
      const homeDir = AbsoluteFilePathStub({ value: '/home/user' });

      proxy.setupMainEntries({
        content: '{"type":"user","timestamp":"2025-01-01T00:00:00Z","message":"hello"}',
      });
      proxy.setupSubagentDir({ files: ['agent-1.jsonl'] });
      proxy.setupSubagentEntries({
        content: '{"type":"assistant","timestamp":"2025-01-01T00:00:01Z","message":"sub-reply"}',
      });

      const result = await sessionChatHistoryBroker({ sessionId, projectPath, homeDir });

      expect(result).toHaveLength(2);
    });

    it('VALID: {subagents dir missing} => returns only main session entries', async () => {
      const proxy = sessionChatHistoryBrokerProxy();
      const sessionId = SessionIdStub({ value: 'test-session-4' });
      const projectPath = AbsoluteFilePathStub({ value: '/home/user/my-project' });
      const homeDir = AbsoluteFilePathStub({ value: '/home/user' });

      proxy.setupMainEntries({
        content: '{"type":"user","timestamp":"2025-01-01T00:00:00Z","message":"hello"}',
      });
      proxy.setupSubagentDirMissing();

      const result = await sessionChatHistoryBroker({ sessionId, projectPath, homeDir });

      expect(result).toHaveLength(1);
    });
  });
});
