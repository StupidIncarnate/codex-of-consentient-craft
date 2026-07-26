import { registerSpyOn } from '@dungeonmaster/testing/register-mock';

export const indexProxy = (): Record<PropertyKey, never> => {
  // start-orchestrator runs its passive-watcher bootstraps (rate-limits poller, stale-process
  // watchdog, execution-queue runner) at module load via setInterval. Mock the global scheduler
  // so those real timers never start — otherwise they outlive jest's per-file module reset and
  // keep firing for the worker's whole lifetime, and the rate-limits poller writes read-errors
  // into other test files' stderr spies (notably chat-spawn).
  // Every module-load poller must be blocked, current and future, regardless of the delay each
  // one schedules with — there is no argument to key on that stays safe as pollers are added or
  // change their interval, so [] (matches every call) is the genuinely correct address here.
  const setIntervalSpy = registerSpyOn({ object: globalThis, method: 'setInterval' });
  setIntervalSpy.calledWith([]).implement((() => 0 as never) as never);

  const clearIntervalSpy = registerSpyOn({ object: globalThis, method: 'clearInterval' });
  clearIntervalSpy.calledWith([]).implement((() => undefined) as never);

  return {};
};
