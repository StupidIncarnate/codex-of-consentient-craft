import {
  GuildStub,
  GuildConfigStub,
  GuildIdStub,
  ProcessIdStub,
  SessionIdStub,
} from '@dungeonmaster/shared/contracts';

import { chatLineProcessTransformer } from '../../../transformers/chat-line-process/chat-line-process-transformer';

import { chatMainSessionTailBroker } from './chat-main-session-tail-broker';
import { chatMainSessionTailBrokerProxy } from './chat-main-session-tail-broker.proxy';

const flushImmediate = async (): Promise<void> =>
  new Promise((resolve) => {
    setImmediate(resolve);
  });

describe('chatMainSessionTailBroker', () => {
  describe('tailing main session lines', () => {
    it('VALID: {task-notification line appended post-exit} => dispatches parsed task_notification entry via onEntries', async () => {
      const proxy = chatMainSessionTailBrokerProxy();
      const guildId = GuildIdStub({ value: 'f47ac10b-58cc-4372-a567-0e02b2c3d479' });
      const sessionId = SessionIdStub({ value: 'test-session-main-tail' });
      const chatProcessId = ProcessIdStub({ value: 'proc-main-1' });
      const guild = GuildStub({ id: guildId, path: '/home/user/my-project' });
      const config = GuildConfigStub({ guilds: [guild] });
      const processor = chatLineProcessTransformer();

      proxy.setupGuild({ config, homeDir: '/home/user' });
      proxy.setupLines({
        lines: [
          JSON.stringify({
            type: 'user',
            message: {
              role: 'user',
              content:
                '<task-notification><task-id>task-bg-1</task-id><status>completed</status><summary>Background agent done</summary><result>All good</result></task-notification>',
            },
          }),
        ],
      });

      const batches: unknown[] = [];
      const patches: unknown[] = [];

      await chatMainSessionTailBroker({
        sessionId,
        guildId,
        processor,
        chatProcessId,
        onEntries: ({ chatProcessId: cpId, entries }) => {
          batches.push({ chatProcessId: cpId, entries });
        },
        onPatch: ({ chatProcessId: cpId, toolUseId, agentId: patchAgentId }) => {
          patches.push({ chatProcessId: cpId, toolUseId, agentId: patchAgentId });
        },
      });

      proxy.triggerChange();
      await flushImmediate();

      expect(batches).toStrictEqual([
        {
          chatProcessId: 'proc-main-1',
          entries: [
            {
              role: 'system',
              type: 'task_notification',
              taskId: 'task-bg-1',
              status: 'completed',
              summary: 'Background agent done',
              result: 'All good',
            },
          ],
        },
      ]);
      expect(patches).toStrictEqual([]);
    });

    it('EMPTY: {non user/assistant line} => dispatches nothing', async () => {
      const proxy = chatMainSessionTailBrokerProxy();
      const guildId = GuildIdStub({ value: 'f47ac10b-58cc-4372-a567-0e02b2c3d479' });
      const sessionId = SessionIdStub({ value: 'test-session-main-noise' });
      const chatProcessId = ProcessIdStub({ value: 'proc-main-noise' });
      const guild = GuildStub({ id: guildId, path: '/home/user/my-project' });
      const config = GuildConfigStub({ guilds: [guild] });
      const processor = chatLineProcessTransformer();

      proxy.setupGuild({ config, homeDir: '/home/user' });
      proxy.setupLines({
        lines: ['{"type":"system","subtype":"init"}'],
      });

      const batches: unknown[] = [];
      const patches: unknown[] = [];

      await chatMainSessionTailBroker({
        sessionId,
        guildId,
        processor,
        chatProcessId,
        onEntries: ({ chatProcessId: cpId, entries }) => {
          batches.push({ chatProcessId: cpId, entries });
        },
        onPatch: ({ chatProcessId: cpId, toolUseId, agentId: patchAgentId }) => {
          patches.push({ chatProcessId: cpId, toolUseId, agentId: patchAgentId });
        },
      });

      proxy.triggerChange();
      await flushImmediate();

      expect(batches).toStrictEqual([]);
      expect(patches).toStrictEqual([]);
    });

    it('VALID: {stop handle} => returns a function that stops further emissions', async () => {
      const proxy = chatMainSessionTailBrokerProxy();
      const guildId = GuildIdStub({ value: 'f47ac10b-58cc-4372-a567-0e02b2c3d479' });
      const sessionId = SessionIdStub({ value: 'test-session-main-stop' });
      const chatProcessId = ProcessIdStub({ value: 'proc-main-stop' });
      const guild = GuildStub({ id: guildId, path: '/home/user/my-project' });
      const config = GuildConfigStub({ guilds: [guild] });
      const processor = chatLineProcessTransformer();

      proxy.setupGuild({ config, homeDir: '/home/user' });

      const batches: unknown[] = [];

      const stop = await chatMainSessionTailBroker({
        sessionId,
        guildId,
        processor,
        chatProcessId,
        onEntries: ({ chatProcessId: cpId, entries }) => {
          batches.push({ chatProcessId: cpId, entries });
        },
        onPatch: () => {},
      });

      stop();

      proxy.setupLines({ lines: ['{"type":"user","message":{"role":"user","content":"late"}}'] });
      proxy.triggerChange();
      await flushImmediate();

      expect(batches).toStrictEqual([]);
    });
  });
});
