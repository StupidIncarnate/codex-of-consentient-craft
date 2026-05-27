import { monitorSessionState } from '../../../state/monitor-session/monitor-session-state';
import { QuestMonitorWatcherStartResponder } from './quest-monitor-watcher-start-responder';
import { QuestMonitorWatcherStartResponderProxy } from './quest-monitor-watcher-start-responder.proxy';

describe('QuestMonitorWatcherStartResponder', () => {
  describe('start + stop lifecycle', () => {
    it('VALID: {parentSessionId, projectDir} => registers and returns handle', async () => {
      monitorSessionState.clear();
      const proxy = QuestMonitorWatcherStartResponderProxy();
      proxy.setupHomeDir({ path: '/home/user' });

      const handle = await QuestMonitorWatcherStartResponder({
        parentSessionId: '44444444-4444-4444-4444-444444444444',
        projectDir: '/home/user/proj',
      });

      expect(monitorSessionState.isRegistered()).toBe(true);

      handle.stop();

      expect(monitorSessionState.isRegistered()).toBe(false);
    });
  });
});
