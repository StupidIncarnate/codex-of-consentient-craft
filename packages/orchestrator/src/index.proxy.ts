import { registerSpyOn } from '@dungeonmaster/testing/register-mock';

// INSTALLED AT MODULE SCOPE, and that placement is the whole point. start-orchestrator runs its
// passive-watcher bootstraps (rate-limits poller, stale-process watchdog, execution-queue runner)
// at MODULE LOAD via setInterval, so anything mocking the scheduler from inside a test — or from
// inside the exported function below — arrives after those timers have already started. A test file
// that imports this module BEFORE the orchestrator barrel gets the spy in place first, because a
// CJS require runs its imports in source order. Verified by making the implementation throw: the
// barrel import died with that error, so the bootstraps really do come through here.
//
// The timers matter because they outlive jest's per-file module reset and keep firing for the
// worker's whole lifetime — the rate-limits poller reads a file every 5s and writes read-errors
// into a LATER test file's stderr spy, notably chat-spawn.
//
// `[]` matches every call, and that is the genuinely correct address: every module-load poller must
// be blocked, current and future, whatever delay it schedules with, and there is no argument to key
// on that stays safe as pollers are added or change their interval.
//
// The stand-in is an OBJECT, not a number: `timerSetIntervalAdapter` calls `.unref()` on what
// `setInterval` hands back, so a bare number makes every bootstrap throw at module load.
const fakeHandle = {
  unref: (): void => undefined,
  ref: (): void => undefined,
  hasRef: (): boolean => false,
};

const setIntervalSpy = registerSpyOn({ object: globalThis, method: 'setInterval' });
setIntervalSpy.calledWith([]).implement((() => fakeHandle as never) as never);

const clearIntervalSpy = registerSpyOn({ object: globalThis, method: 'clearInterval' });
clearIntervalSpy.calledWith([]).implement((() => undefined) as never);

export const indexProxy = (): Record<PropertyKey, never> => ({});
