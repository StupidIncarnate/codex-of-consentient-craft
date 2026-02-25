import {
  GuildStub,
  GuildConfigStub,
  GuildIdStub,
  SessionIdStub,
  ProcessIdStub,
} from '@dungeonmaster/shared/contracts';

import { AgentIdStub } from '../../../contracts/agent-id/agent-id.stub';
import { chatLineProcessTransformer } from '../../../transformers/chat-line-process/chat-line-process-transformer';

import { chatSubagentTailBroker } from './chat-subagent-tail-broker';
import { chatSubagentTailBrokerProxy } from './chat-subagent-tail-broker.proxy';

const flushImmediate = async (): Promise<void> =>
  new Promise((resolve) => {
    setImmediate(resolve);
  });

describe('chatSubagentTailBroker', () => {
  describe('tailing subagent lines', () => {
    it('VALID: {assistant line emitted} => dispatches entry via onEntry callback', async () => {
      const proxy = chatSubagentTailBrokerProxy();
      const guildId = GuildIdStub({ value: 'f47ac10b-58cc-4372-a567-0e02b2c3d479' });
      const sessionId = SessionIdStub({ value: 'test-session-1' });
      const agentId = AgentIdStub({ value: 'agent-alpha' });
      const chatProcessId = ProcessIdStub({ value: 'proc-tail-1' });
      const guild = GuildStub({ id: guildId, path: '/home/user/my-project' });
      const config = GuildConfigStub({ guilds: [guild] });
      const processor = chatLineProcessTransformer();

      proxy.setupGuild({ config, homeDir: '/home/user' });
      proxy.setupLines({
        lines: [
          '{"type":"assistant","timestamp":"2025-01-01T00:00:00Z","message":{"content":[{"type":"text","text":"hello from subagent"}]}}',
        ],
      });

      const entries: unknown[] = [];
      const patches: unknown[] = [];

      await chatSubagentTailBroker({
        sessionId,
        guildId,
        agentId,
        processor,
        onEntry: ({ chatProcessId: cpId, entry }) => {
          entries.push({ chatProcessId: cpId, entry });
        },
        onPatch: ({ chatProcessId: cpId, toolUseId, agentId: patchAgentId }) => {
          patches.push({ chatProcessId: cpId, toolUseId, agentId: patchAgentId });
        },
        chatProcessId,
      });

      proxy.triggerChange();
      await flushImmediate();

      expect(entries).toStrictEqual([
        {
          chatProcessId: 'proc-tail-1',
          entry: {
            type: 'assistant',
            timestamp: '2025-01-01T00:00:00Z',
            message: { content: [{ type: 'text', text: 'hello from subagent' }] },
            source: 'subagent',
            agentId: 'agent-alpha',
          },
        },
      ]);
      expect(patches).toStrictEqual([]);
    });

    it('VALID: {user line emitted} => dispatches entry via onEntry callback', async () => {
      const proxy = chatSubagentTailBrokerProxy();
      const guildId = GuildIdStub({ value: 'f47ac10b-58cc-4372-a567-0e02b2c3d479' });
      const sessionId = SessionIdStub({ value: 'test-session-2' });
      const agentId = AgentIdStub({ value: 'agent-beta' });
      const chatProcessId = ProcessIdStub({ value: 'proc-tail-2' });
      const guild = GuildStub({ id: guildId, path: '/home/user/my-project' });
      const config = GuildConfigStub({ guilds: [guild] });
      const processor = chatLineProcessTransformer();

      proxy.setupGuild({ config, homeDir: '/home/user' });
      proxy.setupLines({
        lines: [
          '{"type":"user","timestamp":"2025-01-01T00:00:00Z","message":{"content":[{"type":"text","text":"user input"}]}}',
        ],
      });

      const entries: unknown[] = [];
      const patches: unknown[] = [];

      await chatSubagentTailBroker({
        sessionId,
        guildId,
        agentId,
        processor,
        onEntry: ({ chatProcessId: cpId, entry }) => {
          entries.push({ chatProcessId: cpId, entry });
        },
        onPatch: ({ chatProcessId: cpId, toolUseId, agentId: patchAgentId }) => {
          patches.push({ chatProcessId: cpId, toolUseId, agentId: patchAgentId });
        },
        chatProcessId,
      });

      proxy.triggerChange();
      await flushImmediate();

      expect(entries).toStrictEqual([
        {
          chatProcessId: 'proc-tail-2',
          entry: {
            type: 'user',
            timestamp: '2025-01-01T00:00:00Z',
            message: { content: [{ type: 'text', text: 'user input' }] },
            source: 'subagent',
          },
        },
      ]);
      expect(patches).toStrictEqual([]);
    });

    it('EMPTY: {system line emitted} => dispatches nothing', async () => {
      const proxy = chatSubagentTailBrokerProxy();
      const guildId = GuildIdStub({ value: 'f47ac10b-58cc-4372-a567-0e02b2c3d479' });
      const sessionId = SessionIdStub({ value: 'test-session-3' });
      const agentId = AgentIdStub({ value: 'agent-gamma' });
      const chatProcessId = ProcessIdStub({ value: 'proc-tail-3' });
      const guild = GuildStub({ id: guildId, path: '/home/user/my-project' });
      const config = GuildConfigStub({ guilds: [guild] });
      const processor = chatLineProcessTransformer();

      proxy.setupGuild({ config, homeDir: '/home/user' });
      proxy.setupLines({
        lines: ['{"type":"system","timestamp":"2025-01-01T00:00:00Z"}'],
      });

      const entries: unknown[] = [];
      const patches: unknown[] = [];

      await chatSubagentTailBroker({
        sessionId,
        guildId,
        agentId,
        processor,
        onEntry: ({ chatProcessId: cpId, entry }) => {
          entries.push({ chatProcessId: cpId, entry });
        },
        onPatch: ({ chatProcessId: cpId, toolUseId, agentId: patchAgentId }) => {
          patches.push({ chatProcessId: cpId, toolUseId, agentId: patchAgentId });
        },
        chatProcessId,
      });

      proxy.triggerChange();
      await flushImmediate();

      expect(entries).toStrictEqual([]);
      expect(patches).toStrictEqual([]);
    });

    it('VALID: {multiple lines emitted} => dispatches all entries in order', async () => {
      const proxy = chatSubagentTailBrokerProxy();
      const guildId = GuildIdStub({ value: 'f47ac10b-58cc-4372-a567-0e02b2c3d479' });
      const sessionId = SessionIdStub({ value: 'test-session-4' });
      const agentId = AgentIdStub({ value: 'agent-delta' });
      const chatProcessId = ProcessIdStub({ value: 'proc-tail-4' });
      const guild = GuildStub({ id: guildId, path: '/home/user/my-project' });
      const config = GuildConfigStub({ guilds: [guild] });
      const processor = chatLineProcessTransformer();

      proxy.setupGuild({ config, homeDir: '/home/user' });
      proxy.setupLines({
        lines: [
          '{"type":"user","timestamp":"2025-01-01T00:00:00Z","message":{"content":[{"type":"text","text":"first"}]}}',
          '{"type":"assistant","timestamp":"2025-01-01T00:00:01Z","message":{"content":[{"type":"text","text":"second"}]}}',
        ],
      });

      const entries: unknown[] = [];
      const patches: unknown[] = [];

      await chatSubagentTailBroker({
        sessionId,
        guildId,
        agentId,
        processor,
        onEntry: ({ chatProcessId: cpId, entry }) => {
          entries.push({ chatProcessId: cpId, entry });
        },
        onPatch: ({ chatProcessId: cpId, toolUseId, agentId: patchAgentId }) => {
          patches.push({ chatProcessId: cpId, toolUseId, agentId: patchAgentId });
        },
        chatProcessId,
      });

      proxy.triggerChange();
      await flushImmediate();

      expect(entries).toStrictEqual([
        {
          chatProcessId: 'proc-tail-4',
          entry: {
            type: 'user',
            timestamp: '2025-01-01T00:00:00Z',
            message: { content: [{ type: 'text', text: 'first' }] },
            source: 'subagent',
          },
        },
        {
          chatProcessId: 'proc-tail-4',
          entry: {
            type: 'assistant',
            timestamp: '2025-01-01T00:00:01Z',
            message: { content: [{ type: 'text', text: 'second' }] },
            source: 'subagent',
            agentId: 'agent-delta',
          },
        },
      ]);
      expect(patches).toStrictEqual([]);
    });

    it('VALID: {stop called} => returns stop function from tail handle', async () => {
      const proxy = chatSubagentTailBrokerProxy();
      const guildId = GuildIdStub({ value: 'f47ac10b-58cc-4372-a567-0e02b2c3d479' });
      const sessionId = SessionIdStub({ value: 'test-session-5' });
      const agentId = AgentIdStub({ value: 'agent-epsilon' });
      const chatProcessId = ProcessIdStub({ value: 'proc-tail-5' });
      const guild = GuildStub({ id: guildId, path: '/home/user/my-project' });
      const config = GuildConfigStub({ guilds: [guild] });
      const processor = chatLineProcessTransformer();

      proxy.setupGuild({ config, homeDir: '/home/user' });

      const stop = await chatSubagentTailBroker({
        sessionId,
        guildId,
        agentId,
        processor,
        onEntry: () => {},
        onPatch: () => {},
        chatProcessId,
      });

      expect(typeof stop).toBe('function');
    });
  });
});
