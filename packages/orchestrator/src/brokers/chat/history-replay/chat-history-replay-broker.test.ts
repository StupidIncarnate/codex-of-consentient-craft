import {
  AssistantTextStreamLineStub,
  GuildStub,
  GuildConfigStub,
  GuildIdStub,
  SessionIdStub,
  UserTextArrayStreamLineStub,
} from '@dungeonmaster/shared/contracts';
import { FileNameStub } from '@dungeonmaster/shared/contracts';

import { chatHistoryReplayBroker } from './chat-history-replay-broker';
import { chatHistoryReplayBrokerProxy } from './chat-history-replay-broker.proxy';

describe('chatHistoryReplayBroker', () => {
  describe('session replay', () => {
    it('VALID: {session with user and assistant lines} => emits entries via onEntry callback', async () => {
      const proxy = chatHistoryReplayBrokerProxy();
      const guildId = GuildIdStub({ value: 'f47ac10b-58cc-4372-a567-0e02b2c3d479' });
      const sessionId = SessionIdStub({ value: 'test-session-1' });
      const guild = GuildStub({
        id: guildId,
        path: '/home/user/my-project',
      });
      const config = GuildConfigStub({ guilds: [guild] });

      proxy.setupGuild({ config, homeDir: '/home/user' });
      proxy.setupMainSession({
        content:
          '{"type":"user","timestamp":"2025-01-01T00:00:00Z","message":{"content":[{"type":"text","text":"hello"}]}}\n{"type":"assistant","timestamp":"2025-01-01T00:00:01Z","message":{"content":[{"type":"text","text":"hi"}]}}',
      });
      proxy.setupSubagentDirMissing();

      const entries: unknown[] = [];
      const patches: unknown[] = [];

      await chatHistoryReplayBroker({
        sessionId,
        guildId,
        onEntry: ({ entry }) => {
          entries.push(entry);
        },
        onPatch: ({ toolUseId, agentId }) => {
          patches.push({ toolUseId, agentId });
        },
      });

      expect(entries).toStrictEqual([
        {
          type: 'user',
          timestamp: '2025-01-01T00:00:00Z',
          message: { content: [{ type: 'text', text: 'hello' }] },
          source: 'session',
        },
        {
          type: 'assistant',
          timestamp: '2025-01-01T00:00:01Z',
          message: { content: [{ type: 'text', text: 'hi' }] },
          source: 'session',
        },
      ]);
      expect(patches).toStrictEqual([]);
    });

    it('EMPTY: {session with only system entries} => emits nothing', async () => {
      const proxy = chatHistoryReplayBrokerProxy();
      const guildId = GuildIdStub({ value: 'f47ac10b-58cc-4372-a567-0e02b2c3d479' });
      const sessionId = SessionIdStub({ value: 'test-session-2' });
      const guild = GuildStub({
        id: guildId,
        path: '/home/user/my-project',
      });
      const config = GuildConfigStub({ guilds: [guild] });

      proxy.setupGuild({ config, homeDir: '/home/user' });
      proxy.setupMainSession({
        content: '{"type":"system","timestamp":"2025-01-01T00:00:00Z"}',
      });
      proxy.setupSubagentDirMissing();

      const entries: unknown[] = [];
      const patches: unknown[] = [];

      await chatHistoryReplayBroker({
        sessionId,
        guildId,
        onEntry: ({ entry }) => {
          entries.push(entry);
        },
        onPatch: ({ toolUseId, agentId }) => {
          patches.push({ toolUseId, agentId });
        },
      });

      expect(entries).toStrictEqual([]);
      expect(patches).toStrictEqual([]);
    });

    it('VALID: {session with subagent entries} => emits both session and subagent entries', async () => {
      const proxy = chatHistoryReplayBrokerProxy();
      const guildId = GuildIdStub({ value: 'f47ac10b-58cc-4372-a567-0e02b2c3d479' });
      const sessionId = SessionIdStub({ value: 'test-session-3' });
      const guild = GuildStub({
        id: guildId,
        path: '/home/user/my-project',
      });
      const config = GuildConfigStub({ guilds: [guild] });

      proxy.setupGuild({ config, homeDir: '/home/user' });
      proxy.setupMainSession({
        content:
          '{"type":"user","timestamp":"2025-01-01T00:00:00Z","message":{"content":[{"type":"text","text":"hello"}]}}',
      });
      proxy.setupSubagentDir({ files: [FileNameStub({ value: 'agent-a1b2c3d4.jsonl' })] });
      proxy.setupSubagentFile({
        content:
          '{"type":"assistant","timestamp":"2025-01-01T00:00:01Z","message":{"content":[{"type":"text","text":"sub-reply"}]}}',
      });

      const entries: unknown[] = [];
      const patches: unknown[] = [];

      await chatHistoryReplayBroker({
        sessionId,
        guildId,
        onEntry: ({ entry }) => {
          entries.push(entry);
        },
        onPatch: ({ toolUseId, agentId }) => {
          patches.push({ toolUseId, agentId });
        },
      });

      expect(entries).toStrictEqual([
        {
          type: 'user',
          timestamp: '2025-01-01T00:00:00Z',
          message: { content: [{ type: 'text', text: 'hello' }] },
          source: 'session',
        },
        {
          type: 'assistant',
          timestamp: '2025-01-01T00:00:01Z',
          message: { content: [{ type: 'text', text: 'sub-reply' }] },
          source: 'subagent',
          agentId: 'a1b2c3d4',
        },
      ]);
      expect(patches).toStrictEqual([]);
    });

    it('VALID: {subagent file named agent-a1b2c3d4.jsonl} => emits entries with agentId stripped of agent- prefix', async () => {
      const proxy = chatHistoryReplayBrokerProxy();
      const guildId = GuildIdStub({ value: 'f47ac10b-58cc-4372-a567-0e02b2c3d479' });
      const sessionId = SessionIdStub({ value: 'test-session-agentid' });
      const guild = GuildStub({
        id: guildId,
        path: '/home/user/my-project',
      });
      const config = GuildConfigStub({ guilds: [guild] });

      proxy.setupGuild({ config, homeDir: '/home/user' });
      proxy.setupMainSession({
        content:
          '{"type":"user","timestamp":"2025-01-01T00:00:00Z","message":{"content":[{"type":"text","text":"hello"}]}}',
      });
      proxy.setupSubagentDir({ files: [FileNameStub({ value: 'agent-a1b2c3d4.jsonl' })] });
      proxy.setupSubagentFile({
        content:
          '{"type":"assistant","timestamp":"2025-01-01T00:00:01Z","message":{"content":[{"type":"text","text":"sub-reply"}]}}',
      });

      const entries: unknown[] = [];

      await chatHistoryReplayBroker({
        sessionId,
        guildId,
        onEntry: ({ entry }) => {
          entries.push(entry);
        },
        onPatch: () => {},
      });

      expect(entries[1]).toStrictEqual({
        type: 'assistant',
        timestamp: '2025-01-01T00:00:01Z',
        message: { content: [{ type: 'text', text: 'sub-reply' }] },
        source: 'subagent',
        agentId: 'a1b2c3d4',
      });
    });

    it('VALID: {subagents dir missing} => emits only main session entries', async () => {
      const proxy = chatHistoryReplayBrokerProxy();
      const guildId = GuildIdStub({ value: 'f47ac10b-58cc-4372-a567-0e02b2c3d479' });
      const sessionId = SessionIdStub({ value: 'test-session-4' });
      const guild = GuildStub({
        id: guildId,
        path: '/home/user/my-project',
      });
      const config = GuildConfigStub({ guilds: [guild] });

      proxy.setupGuild({ config, homeDir: '/home/user' });
      proxy.setupMainSession({
        content:
          '{"type":"assistant","timestamp":"2025-01-01T00:00:00Z","message":{"content":[{"type":"text","text":"response"}]}}',
      });
      proxy.setupSubagentDirMissing();

      const entries: unknown[] = [];
      const patches: unknown[] = [];

      await chatHistoryReplayBroker({
        sessionId,
        guildId,
        onEntry: ({ entry }) => {
          entries.push(entry);
        },
        onPatch: ({ toolUseId, agentId }) => {
          patches.push({ toolUseId, agentId });
        },
      });

      expect(entries).toStrictEqual([
        {
          type: 'assistant',
          timestamp: '2025-01-01T00:00:00Z',
          message: { content: [{ type: 'text', text: 'response' }] },
          source: 'session',
        },
      ]);
      expect(patches).toStrictEqual([]);
    });

    it('VALID: {session with tool_use then tool_result with agentId} => emits patch', async () => {
      const proxy = chatHistoryReplayBrokerProxy();
      const guildId = GuildIdStub({ value: 'f47ac10b-58cc-4372-a567-0e02b2c3d479' });
      const sessionId = SessionIdStub({ value: 'test-session-patch' });
      const guild = GuildStub({
        id: guildId,
        path: '/home/user/my-project',
      });
      const config = GuildConfigStub({ guilds: [guild] });

      proxy.setupGuild({ config, homeDir: '/home/user' });
      proxy.setupMainSession({
        content:
          '{"type":"assistant","message":{"role":"assistant","content":[{"type":"tool_use","id":"toolu_patch_01","name":"Task","input":{}}]}}\n{"type":"user","message":{"role":"user","content":[{"type":"tool_result","tool_use_id":"toolu_patch_01","content":"done"}]},"toolUseResult":{"agentId":"agent-patch"}}',
      });
      proxy.setupSubagentDirMissing();

      const entries: unknown[] = [];
      const patches: unknown[] = [];

      await chatHistoryReplayBroker({
        sessionId,
        guildId,
        onEntry: ({ entry }) => {
          entries.push(entry);
        },
        onPatch: ({ toolUseId, agentId }) => {
          patches.push({ toolUseId, agentId });
        },
      });

      expect(patches).toStrictEqual([{ toolUseId: 'toolu_patch_01', agentId: 'agent-patch' }]);
      expect(entries).toStrictEqual([
        {
          type: 'assistant',
          message: {
            role: 'assistant',
            content: [{ type: 'tool_use', id: 'toolu_patch_01', name: 'Task', input: {} }],
          },
          source: 'session',
        },
        {
          type: 'user',
          message: {
            role: 'user',
            content: [{ type: 'tool_result', tool_use_id: 'toolu_patch_01', content: 'done' }],
          },
          toolUseResult: { agentId: 'agent-patch' },
          source: 'session',
          agentId: 'agent-patch',
        },
      ]);
    });

    it('VALID: {subagent messages between session messages} => emits entries in chronological order', async () => {
      const proxy = chatHistoryReplayBrokerProxy();
      const guildId = GuildIdStub({ value: 'f47ac10b-58cc-4372-a567-0e02b2c3d479' });
      const sessionId = SessionIdStub({ value: 'test-session-interleave' });
      const guild = GuildStub({
        id: guildId,
        path: '/home/user/my-project',
      });
      const config = GuildConfigStub({ guilds: [guild] });

      const userBefore = UserTextArrayStreamLineStub({
        message: { role: 'user', content: [{ type: 'text', text: 'before' }] },
      });
      const assistantAfter = AssistantTextStreamLineStub({
        message: { role: 'assistant', content: [{ type: 'text', text: 'after' }] },
      });
      const assistantMiddle = AssistantTextStreamLineStub({
        message: { role: 'assistant', content: [{ type: 'text', text: 'middle' }] },
      });

      proxy.setupGuild({ config, homeDir: '/home/user' });
      proxy.setupMainSession({
        content: [
          JSON.stringify({ ...userBefore, timestamp: '2025-01-01T00:00:00Z' }),
          JSON.stringify({ ...assistantAfter, timestamp: '2025-01-01T00:00:10Z' }),
        ].join('\n'),
      });
      proxy.setupSubagentDir({ files: [FileNameStub({ value: 'agent-amid1234.jsonl' })] });
      proxy.setupSubagentFile({
        content: JSON.stringify({ ...assistantMiddle, timestamp: '2025-01-01T00:00:05Z' }),
      });

      const entries: unknown[] = [];

      await chatHistoryReplayBroker({
        sessionId,
        guildId,
        onEntry: ({ entry }) => {
          entries.push(entry);
        },
        onPatch: () => {},
      });

      expect(entries).toStrictEqual([
        {
          ...userBefore,
          timestamp: '2025-01-01T00:00:00Z',
          source: 'session',
        },
        {
          ...assistantMiddle,
          timestamp: '2025-01-01T00:00:05Z',
          source: 'subagent',
          agentId: 'amid1234',
        },
        {
          ...assistantAfter,
          timestamp: '2025-01-01T00:00:10Z',
          source: 'session',
        },
      ]);
    });

    it('VALID: {subagent dir with non-jsonl files} => ignores non-jsonl files', async () => {
      const proxy = chatHistoryReplayBrokerProxy();
      const guildId = GuildIdStub({ value: 'f47ac10b-58cc-4372-a567-0e02b2c3d479' });
      const sessionId = SessionIdStub({ value: 'test-session-5' });
      const guild = GuildStub({
        id: guildId,
        path: '/home/user/my-project',
      });
      const config = GuildConfigStub({ guilds: [guild] });

      proxy.setupGuild({ config, homeDir: '/home/user' });
      proxy.setupMainSession({
        content:
          '{"type":"user","timestamp":"2025-01-01T00:00:00Z","message":{"content":[{"type":"text","text":"test"}]}}',
      });
      proxy.setupSubagentDir({
        files: [FileNameStub({ value: 'readme.txt' }), FileNameStub({ value: 'notes.md' })],
      });

      const entries: unknown[] = [];
      const patches: unknown[] = [];

      await chatHistoryReplayBroker({
        sessionId,
        guildId,
        onEntry: ({ entry }) => {
          entries.push(entry);
        },
        onPatch: ({ toolUseId, agentId }) => {
          patches.push({ toolUseId, agentId });
        },
      });

      expect(entries).toStrictEqual([
        {
          type: 'user',
          timestamp: '2025-01-01T00:00:00Z',
          message: { content: [{ type: 'text', text: 'test' }] },
          source: 'session',
        },
      ]);
      expect(patches).toStrictEqual([]);
    });
  });
});
