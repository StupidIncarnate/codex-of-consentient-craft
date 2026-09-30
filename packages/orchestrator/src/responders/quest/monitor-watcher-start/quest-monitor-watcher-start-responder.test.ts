import { SessionIdStub } from '@dungeonmaster/shared/contracts/session-id/session-id.stub';
import { QuestWorkItemIdStub } from '@dungeonmaster/shared/contracts/quest-work-item-id/quest-work-item-id.stub';
import { QuestIdStub } from '@dungeonmaster/shared/contracts/quest-id/quest-id.stub';

import { QuestMonitorWatcherStartResponder } from './quest-monitor-watcher-start-responder';
import { QuestMonitorWatcherStartResponderProxy } from './quest-monitor-watcher-start-responder.proxy';
import { setImmediate } from '#gateway/node/setImmediate';

describe('QuestMonitorWatcherStartResponder', () => {
  describe('start + stop lifecycle', () => {
    it('VALID: {parentSessionId, projectDir, workerWorkItemId, workerQuestId} => returns handle whose stop is idempotent', async () => {
      const proxy = QuestMonitorWatcherStartResponderProxy();
      proxy.setupHomeDir({ path: '/home/user' });
      proxy.setupSessionFile({
        homeDir: '/home/user',
        projectDir: '/home/user/proj',
        parentSessionId: '00118165-fbf1-11d4-8940-5ee9492debae',
      });

      const handle = await QuestMonitorWatcherStartResponder({
        parentSessionId: SessionIdStub({ value: '00118165-fbf1-11d4-8940-5ee9492debae' }),
        projectDir: '/home/user/proj',
        workerWorkItemId: QuestWorkItemIdStub(),
        workerQuestId: QuestIdStub(),
      });

      // The tail's first drain settles before the handle is stopped.
      await new Promise((resolve) => {
        setImmediate(resolve);
      });

      // The quest-driven reactor calls stop() during reconcile when a sessionId drops
      // out of the active set, then again on server shutdown. Both must be safe.
      let threw = false;
      try {
        handle.stop();
        handle.stop();
      } catch {
        threw = true;
      }

      expect(threw).toBe(false);
    });
  });
});
