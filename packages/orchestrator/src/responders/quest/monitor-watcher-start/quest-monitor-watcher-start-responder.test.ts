import { QuestMonitorWatcherStartResponder } from './quest-monitor-watcher-start-responder';
import { QuestMonitorWatcherStartResponderProxy } from './quest-monitor-watcher-start-responder.proxy';

describe('QuestMonitorWatcherStartResponder', () => {
  describe('start + stop lifecycle', () => {
    it('VALID: {parentSessionId, projectDir} => returns handle whose stop is idempotent', async () => {
      const proxy = QuestMonitorWatcherStartResponderProxy();
      proxy.setupHomeDir({ path: '/home/user' });

      const handle = await QuestMonitorWatcherStartResponder({
        parentSessionId: '44444444-4444-4444-4444-444444444444',
        projectDir: '/home/user/proj',
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
