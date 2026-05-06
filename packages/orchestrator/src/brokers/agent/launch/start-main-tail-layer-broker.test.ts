import {
  GuildConfigStub,
  GuildIdStub,
  GuildStub,
  ProcessIdStub,
  SessionIdStub,
} from '@dungeonmaster/shared/contracts';

import { chatLineProcessTransformer } from '../../../transformers/chat-line-process/chat-line-process-transformer';

import { startMainTailLayerBroker } from './start-main-tail-layer-broker';
import { startMainTailLayerBrokerProxy } from './start-main-tail-layer-broker.proxy';

describe('startMainTailLayerBroker', () => {
  describe('tail startup', () => {
    it('VALID: {tail emits assistant text line} => onEntries fires with sessionId stamped on payload', async () => {
      const proxy = startMainTailLayerBrokerProxy();
      const guildId = GuildIdStub({ value: 'f47ac10b-58cc-4372-a567-0e02b2c3d479' });
      const guild = GuildStub({ id: guildId, path: '/home/user/my-project' });
      proxy.setupGuild({
        config: GuildConfigStub({ guilds: [guild] }),
        homeDir: '/home/user',
      });
      proxy.setupLines({
        lines: [
          JSON.stringify({
            type: 'user',
            uuid: 'tail-line-1',
            timestamp: '2025-01-01T00:00:00.000Z',
            message: {
              role: 'user',
              content:
                '<task-notification><task-id>t1</task-id><status>completed</status><summary>done</summary><result>ok</result></task-notification>',
            },
          }),
        ],
      });

      const onEntries = jest.fn();
      const sessionId = SessionIdStub({ value: 'session-tail-test' });

      const stop = await startMainTailLayerBroker({
        sessionId,
        guildId,
        processor: chatLineProcessTransformer(),
        chatProcessId: ProcessIdStub({ value: 'proc-tail-test' }),
        onEntries,
      });

      proxy.triggerChange();
      await new Promise<void>((resolve) => {
        setImmediate(resolve);
      });

      stop();

      expect(onEntries).toHaveBeenCalledWith({
        chatProcessId: 'proc-tail-test',
        sessionId,
        entries: [
          {
            role: 'system',
            type: 'task_notification',
            taskId: 't1',
            status: 'completed',
            summary: 'done',
            result: 'ok',
            source: 'session',
            uuid: 'tail-line-1:task-notification',
            timestamp: '2025-01-01T00:00:00.000Z',
          },
        ],
      });
    });
  });
});
