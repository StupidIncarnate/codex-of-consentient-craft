import { orchestratorStartMonitorWatcherAdapter } from './orchestrator-start-monitor-watcher-adapter';
import { orchestratorStartMonitorWatcherAdapterProxy } from './orchestrator-start-monitor-watcher-adapter.proxy';

describe('orchestratorStartMonitorWatcherAdapter', () => {
  describe('valid passthrough', () => {
    it('VALID: {parentSessionId, projectDir} => returns handle with stop()', async () => {
      const proxy = orchestratorStartMonitorWatcherAdapterProxy();
      proxy.resolves();

      const handle = await orchestratorStartMonitorWatcherAdapter({
        parentSessionId: 'sess-123',
        projectDir: '/home/user/p',
      });

      expect(proxy.wasStopCalled()).toBe(false);

      handle.stop();

      expect(proxy.wasStopCalled()).toBe(true);
    });
  });

  describe('error passthrough', () => {
    it('ERROR: {orchestrator throws} => adapter rejects', async () => {
      const proxy = orchestratorStartMonitorWatcherAdapterProxy();
      proxy.throws({ error: new Error('start failed') });

      await expect(
        orchestratorStartMonitorWatcherAdapter({
          parentSessionId: 'sess-456',
          projectDir: '/home/user/p',
        }),
      ).rejects.toThrow(/start failed/u);
    });
  });
});
