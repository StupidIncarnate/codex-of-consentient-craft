import { ProcessIdStub } from '@dungeonmaster/shared/contracts/process-id/process-id.stub';
import { RepoRootCwdStub } from '@dungeonmaster/shared/contracts/repo-root-cwd/repo-root-cwd.stub';
import { SessionIdStub } from '@dungeonmaster/shared/contracts/session-id/session-id.stub';
import { setImmediate } from '#gateway/node/setImmediate';

import { chatLineProcessTransformer } from '../../../transformers/chat-line-process/chat-line-process-transformer';

import { startMainTailLayerBroker } from './start-main-tail-layer-broker';
import { startMainTailLayerBrokerProxy } from './start-main-tail-layer-broker.proxy';

describe('startMainTailLayerBroker', () => {
  describe('tail startup', () => {
    it('VALID: {tail emits assistant text line} => onEntries fires with sessionId stamped on payload', async () => {
      const proxy = startMainTailLayerBrokerProxy();
      proxy.setupHomeDir({ homeDir: '/home/user' });
      proxy.setupLines({
        path: '/home/user/.claude/projects/-home-user-my-project/session-tail-test.jsonl',
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

      const stop = startMainTailLayerBroker({
        sessionId,
        cwd: RepoRootCwdStub({ value: '/home/user/my-project' }),
        processor: chatLineProcessTransformer(),
        chatProcessId: ProcessIdStub({ value: 'proc-tail-test' }),
        onEntries,
      });

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
