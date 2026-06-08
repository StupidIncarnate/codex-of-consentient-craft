import { registerSpyOn } from '@dungeonmaster/testing/register-mock';

export const indexProxy = (): Record<PropertyKey, never> => {
  // start-orchestrator runs its passive-watcher bootstraps (rate-limits poller, stale-process
  // watchdog, execution-queue runner) at module load via setInterval. Mock the global scheduler
  // so those real timers never start — otherwise they outlive jest's per-file module reset and
  // keep firing for the worker's whole lifetime, and the rate-limits poller writes read-errors
  // into other test files' stderr spies (notably chat-spawn).
  const setIntervalSpy = registerSpyOn({ object: globalThis, method: 'setInterval' });
  setIntervalSpy.mockImplementation((() => 0 as never) as never);

  const clearIntervalSpy = registerSpyOn({ object: globalThis, method: 'clearInterval' });
  clearIntervalSpy.mockImplementation((() => undefined) as never);

  return {};
};
