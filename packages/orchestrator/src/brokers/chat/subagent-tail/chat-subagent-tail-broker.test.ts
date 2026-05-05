import { claudeLineNormalizeBroker } from '@dungeonmaster/shared/brokers';
import {
  GuildStub,
  GuildConfigStub,
  GuildIdStub,
  SessionIdStub,
  ProcessIdStub,
} from '@dungeonmaster/shared/contracts';

import { AgentIdStub } from '../../../contracts/agent-id/agent-id.stub';
import { ChatLineAgentDetectedStub } from '../../../contracts/chat-line-output/chat-line-output.stub';
import { ChatLineProcessorStub } from '../../../contracts/chat-line-processor/chat-line-processor.stub';
import { ToolUseIdStub } from '../../../contracts/tool-use-id/tool-use-id.stub';
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
          '{"type":"assistant","uuid":"line-uuid-subagent-tail","timestamp":"2025-01-01T00:00:00Z","message":{"content":[{"type":"text","text":"hello from subagent"}]}}',
        ],
      });

      const batches: unknown[] = [];

      await chatSubagentTailBroker({
        sessionId,
        guildId,
        agentId,
        processor,
        onEntries: ({ chatProcessId: cpId, entries }) => {
          batches.push({ chatProcessId: cpId, entries });
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
              uuid: 'line-uuid-subagent-tail:0',
              timestamp: '2025-01-01T00:00:00Z',
            },
          ],
        },
      ]);
    });

    it("VALID: {subagent line tailed} => calls processor.processLine with parsed line, source='subagent', and broker's agentId", async () => {
      const proxy = chatSubagentTailBrokerProxy();
      const guildId = GuildIdStub({ value: 'f47ac10b-58cc-4372-a567-0e02b2c3d479' });
      const sessionId = SessionIdStub({ value: 'test-session-args' });
      const agentId = AgentIdStub({ value: 'agent-delta' });
      const chatProcessId = ProcessIdStub({ value: 'proc-args-1' });
      const guild = GuildStub({ id: guildId, path: '/home/user/my-project' });
      const config = GuildConfigStub({ guilds: [guild] });
      const calls: Parameters<ReturnType<typeof ChatLineProcessorStub>['processLine']>[0][] = [];
      const processor = ChatLineProcessorStub({
        processLine: (params) => {
          calls.push(params);
          return [];
        },
      });

      const rawLine =
        '{"type":"assistant","timestamp":"2025-01-01T00:00:00Z","message":{"content":[{"type":"text","text":"from agent"}]}}';
      const expectedParsed = claudeLineNormalizeBroker({ rawLine });

      proxy.setupGuild({ config, homeDir: '/home/user' });
      proxy.setupLines({ lines: [rawLine] });

      await chatSubagentTailBroker({
        sessionId,
        guildId,
        agentId,
        processor,
        onEntries: () => {},
        chatProcessId,
      });

      proxy.triggerChange();
      await flushImmediate();

      expect(calls).toStrictEqual([
        {
          parsed: expectedParsed,
          source: 'subagent',
          agentId: 'agent-delta',
        },
      ]);
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

      await chatSubagentTailBroker({
        sessionId,
        guildId,
        agentId,
        processor,
        onEntries: ({ chatProcessId: cpId, entries }) => {
          batches.push({ chatProcessId: cpId, entries });
        },
        chatProcessId,
      });

      proxy.triggerChange();
      await flushImmediate();

      expect(batches).toStrictEqual([]);
    });

    it("EDGE: {processor returns type:'agent-detected'} => silently ignored, onEntries never fires", async () => {
      const proxy = chatSubagentTailBrokerProxy();
      const guildId = GuildIdStub({ value: 'f47ac10b-58cc-4372-a567-0e02b2c3d479' });
      const sessionId = SessionIdStub({ value: 'test-session-agent-detected' });
      const agentId = AgentIdStub({ value: 'agent-epsilon' });
      const chatProcessId = ProcessIdStub({ value: 'proc-agent-detected' });
      const guild = GuildStub({ id: guildId, path: '/home/user/my-project' });
      const config = GuildConfigStub({ guilds: [guild] });
      const processor = ChatLineProcessorStub({
        processLine: () => [
          ChatLineAgentDetectedStub({
            toolUseId: ToolUseIdStub({ value: 'toolu_01EaCJyt5y8gzMNyGYarwUDZ' }) as never,
            agentId: AgentIdStub({ value: 'agent-real-internal' }) as never,
          }),
        ],
      });

      proxy.setupGuild({ config, homeDir: '/home/user' });
      proxy.setupLines({
        lines: ['{"type":"assistant","message":{"content":[{"type":"text","text":"anything"}]}}'],
      });

      const batches: unknown[] = [];

      await chatSubagentTailBroker({
        sessionId,
        guildId,
        agentId,
        processor,
        onEntries: ({ chatProcessId: cpId, entries }) => {
          batches.push({ chatProcessId: cpId, entries });
        },
        chatProcessId,
      });

      proxy.triggerChange();
      await flushImmediate();

      expect(batches).toStrictEqual([]);
    });

    it('VALID: {stop handle} => returns a function that stops further emissions', async () => {
      const proxy = chatSubagentTailBrokerProxy();
      const guildId = GuildIdStub({ value: 'f47ac10b-58cc-4372-a567-0e02b2c3d479' });
      const sessionId = SessionIdStub({ value: 'test-session-sub-stop' });
      const agentId = AgentIdStub({ value: 'agent-eta' });
      const chatProcessId = ProcessIdStub({ value: 'proc-sub-stop' });
      const guild = GuildStub({ id: guildId, path: '/home/user/my-project' });
      const config = GuildConfigStub({ guilds: [guild] });
      const processor = chatLineProcessTransformer();

      proxy.setupGuild({ config, homeDir: '/home/user' });

      const batches: unknown[] = [];

      const { stop } = await chatSubagentTailBroker({
        sessionId,
        guildId,
        agentId,
        processor,
        onEntries: ({ chatProcessId: cpId, entries }) => {
          batches.push({ chatProcessId: cpId, entries });
        },
        chatProcessId,
      });

      stop();

      proxy.setupLines({
        lines: ['{"type":"assistant","message":{"content":[{"type":"text","text":"after stop"}]}}'],
      });
      proxy.triggerChange();
      await flushImmediate();

      expect(batches).toStrictEqual([]);
    });
  });
});
