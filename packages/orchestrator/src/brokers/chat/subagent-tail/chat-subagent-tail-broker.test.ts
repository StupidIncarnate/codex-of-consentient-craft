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
    it('VALID: {assistant text line emitted} => dispatches ChatEntry[] via onEntries callback', async () => {
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

      const batches: unknown[] = [];
      const patches: unknown[] = [];

      await chatSubagentTailBroker({
        sessionId,
        guildId,
        agentId,
        processor,
        onEntries: ({ chatProcessId: cpId, entries }) => {
          batches.push({ chatProcessId: cpId, entries });
        },
        onPatch: ({ chatProcessId: cpId, toolUseId, agentId: patchAgentId }) => {
          patches.push({ chatProcessId: cpId, toolUseId, agentId: patchAgentId });
        },
        chatProcessId,
      });

      proxy.triggerChange();
      await flushImmediate();

      expect(batches).toStrictEqual([
        {
          chatProcessId: 'proc-tail-1',
          entries: [
            {
              role: 'assistant',
              type: 'text',
              content: 'hello from subagent',
              source: 'subagent',
              agentId: 'agent-alpha',
            },
          ],
        },
      ]);
      expect(patches).toStrictEqual([]);
    });

    it('EMPTY: {system line emitted} => dispatches nothing', async () => {
      const proxy = chatSubagentTailBrokerProxy();
      const guildId = GuildIdStub({ value: 'f47ac10b-58cc-4372-a567-0e02b2c3d479' });
      const sessionId = SessionIdStub({ value: 'test-session-sys' });
      const agentId = AgentIdStub({ value: 'agent-gamma' });
      const chatProcessId = ProcessIdStub({ value: 'proc-tail-sys' });
      const guild = GuildStub({ id: guildId, path: '/home/user/my-project' });
      const config = GuildConfigStub({ guilds: [guild] });
      const processor = chatLineProcessTransformer();

      proxy.setupGuild({ config, homeDir: '/home/user' });
      proxy.setupLines({
        lines: ['{"type":"system","subtype":"init"}'],
      });

      const batches: unknown[] = [];
      const patches: unknown[] = [];

      await chatSubagentTailBroker({
        sessionId,
        guildId,
        agentId,
        processor,
        onEntries: ({ chatProcessId: cpId, entries }) => {
          batches.push({ chatProcessId: cpId, entries });
        },
        onPatch: ({ chatProcessId: cpId, toolUseId, agentId: patchAgentId }) => {
          patches.push({ chatProcessId: cpId, toolUseId, agentId: patchAgentId });
        },
        chatProcessId,
      });

      proxy.triggerChange();
      await flushImmediate();

      expect(batches).toStrictEqual([]);
      expect(patches).toStrictEqual([]);
    });
  });
});
