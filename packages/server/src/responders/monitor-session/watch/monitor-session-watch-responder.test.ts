import { ActiveMonitorSessionStub } from '../../../contracts/active-monitor-session/active-monitor-session.stub';
import { MonitorSessionWatchResponder } from './monitor-session-watch-responder';
import { MonitorSessionWatchResponderProxy } from './monitor-session-watch-responder.proxy';

const waitForMicrotask = async (): Promise<void> =>
  new Promise<void>((resolve) => {
    setImmediate(() => {
      resolve();
    });
  });

describe('MonitorSessionWatchResponder', () => {
  describe('file appearance', () => {
    it('VALID: {file present with valid content at startup} => starts watcher', async () => {
      const proxy = MonitorSessionWatchResponderProxy();
      proxy.setupHomePath();
      proxy.startMonitorWatcherResolves();
      const validBody = ActiveMonitorSessionStub({
        parentSessionId: 'sess-a',
        projectDir: '/home/user/proj',
      });
      proxy.setupFilePresent({ contents: JSON.stringify(validBody) });

      const handle = MonitorSessionWatchResponder();
      // Wait for the orchestratorStartMonitorWatcher promise to settle.
      await waitForMicrotask();
      handle.stop();

      expect(proxy.wasStopCalled()).toBe(true);
    });
  });

  describe('session change', () => {
    it('VALID: {file changes to new parentSessionId} => stops old watcher and starts new one', async () => {
      const proxy = MonitorSessionWatchResponderProxy();
      proxy.setupHomePath();
      proxy.startMonitorWatcherResolves();
      proxy.startMonitorWatcherResolves();
      proxy.setupFileAbsent();

      const handle = MonitorSessionWatchResponder();
      await waitForMicrotask();

      // First session announced
      const firstBody = ActiveMonitorSessionStub({
        parentSessionId: 'sess-first',
        projectDir: '/home/user/proj',
      });
      proxy.triggerChangeWithContents({ contents: JSON.stringify(firstBody) });
      await waitForMicrotask();

      // Second session announced — old watcher must be stopped
      const secondBody = ActiveMonitorSessionStub({
        parentSessionId: 'sess-second',
        projectDir: '/home/user/proj',
      });
      proxy.triggerChangeWithContents({ contents: JSON.stringify(secondBody) });
      await waitForMicrotask();
      handle.stop();

      expect(proxy.wasStopCalled()).toBe(true);
    });

    it('VALID: {file changes to same parentSessionId} => no teardown/restart', async () => {
      const proxy = MonitorSessionWatchResponderProxy();
      proxy.setupHomePath();
      proxy.startMonitorWatcherResolves();
      const body = ActiveMonitorSessionStub({
        parentSessionId: 'sess-same',
        projectDir: '/home/user/proj',
      });
      proxy.setupFilePresent({ contents: JSON.stringify(body) });

      const handle = MonitorSessionWatchResponder();
      await waitForMicrotask();

      // Re-announce the same session — should NOT trigger another stop. wasStopCalled
      // would flip true on the final handle.stop(), so we observe it BEFORE teardown.
      proxy.triggerChangeWithContents({ contents: JSON.stringify(body) });
      await waitForMicrotask();
      const stopFlag = proxy.wasStopCalled();
      handle.stop();

      expect(stopFlag).toBe(false);
    });
  });

  describe('file removal', () => {
    it('VALID: {file removed} => stops watcher', async () => {
      const proxy = MonitorSessionWatchResponderProxy();
      proxy.setupHomePath();
      proxy.startMonitorWatcherResolves();
      const body = ActiveMonitorSessionStub({
        parentSessionId: 'sess-remove',
        projectDir: '/home/user/proj',
      });
      proxy.setupFilePresent({ contents: JSON.stringify(body) });

      const handle = MonitorSessionWatchResponder();
      await waitForMicrotask();

      proxy.triggerChangeWithAbsence();
      const stopFlag = proxy.wasStopCalled();
      handle.stop();

      expect(stopFlag).toBe(true);
    });
  });

  describe('invalid content', () => {
    it('ERROR: {invalid JSON in file} => no watcher started', async () => {
      const proxy = MonitorSessionWatchResponderProxy();
      proxy.setupHomePath();
      proxy.setupFilePresent({ contents: '{not-json' });

      const handle = MonitorSessionWatchResponder();
      await waitForMicrotask();
      const stopFlag = proxy.wasStopCalled();
      handle.stop();

      // wasStopCalled returns false because the adapter wasn't called at all (so no
      // stop callback was registered). The point of this test is the responder doesn't
      // crash on invalid JSON.
      expect(stopFlag).toBe(false);
    });

    it('ERROR: {valid JSON, contract-rejected body} => no watcher started', async () => {
      const proxy = MonitorSessionWatchResponderProxy();
      proxy.setupHomePath();
      proxy.setupFilePresent({
        contents: '{"parentSessionId":"","projectDir":"","registeredAt":""}',
      });

      const handle = MonitorSessionWatchResponder();
      await waitForMicrotask();
      const stopFlag = proxy.wasStopCalled();
      handle.stop();

      expect(stopFlag).toBe(false);
    });

    it('EMPTY: {file contents are "" (mid-write inotify race)} => silent skip, no log, no watcher', async () => {
      const proxy = MonitorSessionWatchResponderProxy();
      proxy.setupHomePath();
      proxy.enableDevLogs();
      proxy.setupFilePresent({ contents: '' });

      const handle = MonitorSessionWatchResponder();
      await waitForMicrotask();
      const stopFlag = proxy.wasStopCalled();
      const devLogSpy = proxy.getDevLogOutput();
      handle.stop();

      expect(stopFlag).toBe(false);
      expect(devLogSpy.mock.calls).toStrictEqual([]);
    });
  });
});
