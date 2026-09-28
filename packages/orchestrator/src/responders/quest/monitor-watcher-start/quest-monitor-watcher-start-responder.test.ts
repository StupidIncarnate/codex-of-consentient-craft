import { QuestWorkItemIdStub, QuestIdStub } from '@dungeonmaster/shared/contracts';

import { QuestMonitorWatcherStartResponder } from './quest-monitor-watcher-start-responder';
import { QuestMonitorWatcherStartResponderProxy } from './quest-monitor-watcher-start-responder.proxy';

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
        parentSessionId: '00118165-fbf1-11d4-8940-5ee9492debae',
        projectDir: '/home/user/proj',
        workerWorkItemId: String(QuestWorkItemIdStub()),
        workerQuestId: String(QuestIdStub()),
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
