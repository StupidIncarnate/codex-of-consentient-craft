import {
  GuildStub,
  GuildConfigStub,
  GuildIdStub,
  SessionIdStub,
} from '@dungeonmaster/shared/contracts';
import { FileNameStub } from '../../../contracts/file-name/file-name.stub';

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
      proxy.setupSubagentDir({ files: [FileNameStub({ value: 'agent-1.jsonl' })] });
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
          agentId: 'agent-1',
        },
      ]);
      expect(patches).toStrictEqual([]);
    });

    it('VALID: {subagent file named agent-1.jsonl} => emits entries with agentId derived from filename', async () => {
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
      proxy.setupSubagentDir({ files: [FileNameStub({ value: 'agent-1.jsonl' })] });
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
        agentId: 'agent-1',
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
