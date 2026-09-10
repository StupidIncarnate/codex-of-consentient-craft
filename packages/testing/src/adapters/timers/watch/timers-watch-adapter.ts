/**
 * PURPOSE: Replaces the global timer-arming functions with wrappers that announce every timer armed
 * from this point on. Reach for this over jest's `--detectOpenHandles`, which collects on the main
 * thread only — so a worker run reports nothing — and which forces the whole run in band
 * (`if (runInBand || detectOpenHandles)` in `@jest/core`).
 *
 * Both facts that decide whether an armed timer still holds the loop live here, because both are
 * node's business: a fired or cleared timer stops holding it, and a `.unref()`-ed one never held it.
 * `isPending` on each announced ArmedTimer answers with both applied, so the node handle itself
 * never has to cross out of this file.
 *
 * A second call re-points the listener and patches nothing further. Wrapping this adapter's own
 * wrappers would announce every timer twice.
 *
 * USAGE:
 * timersWatchAdapter({onArm: ({armed}) => armedTimers.push(armed)});
 * // Returns {success: true}; every later setTimeout/setInterval/setImmediate calls onArm
 */

import type { AdapterResult } from '@dungeonmaster/shared/contracts';
import { armedTimerContract } from '../../../contracts/armed-timer/armed-timer-contract';
import type { ArmedTimer } from '../../../contracts/armed-timer/armed-timer-contract';
import type { TimerHandle } from '../../../contracts/timer-handle/timer-handle-contract';
import { isTimerHoldingLoopGuard } from '../../../guards/is-timer-holding-loop/is-timer-holding-loop-guard';
import { timerArmStackTransformer } from '../../../transformers/timer-arm-stack/timer-arm-stack-transformer';

// Membership means "armed and not yet settled", so an entry leaves on the fire or the clear and the
// set stays the size of the outstanding timers rather than of every timer the run ever armed.
const pendingHandles = new Set<TimerHandle>();
// The wrappers announce through this list rather than closing over the first caller's function, so a
// later call can take the reporting over without the globals being wrapped a second time. A list
// rather than a reassignable binding, which here can be neither `const` nor initialised to anything
// but `undefined` — lint refuses both.
const armListeners: (({ armed }: { armed: ArmedTimer }) => void)[] = [];
let isWatching = false;

export const timersWatchAdapter = ({
  onArm,
}: {
  onArm: ({ armed }: { armed: ArmedTimer }) => void;
}): AdapterResult => {
  armListeners.splice(0, armListeners.length, onArm);

  if (isWatching) {
    return { success: true as const };
  }
  isWatching = true;

  const realSetTimeout = globalThis.setTimeout;
  const realSetInterval = globalThis.setInterval;
  const realSetImmediate = globalThis.setImmediate;
  const realClearTimeout = globalThis.clearTimeout;
  const realClearInterval = globalThis.clearInterval;
  const realClearImmediate = globalThis.clearImmediate;

  // A one-shot timer that RUNS is not a leak, and nothing clears it — so its settle rides the
  // callback. That callback is built BEFORE the handle exists, so the handle reaches it through a
  // one-element cell rather than through a forward reference.
  globalThis.setTimeout = ((
    callback: (...callbackArgs: never[]) => void,
    ms?: number,
    ...args: never[]
  ) => {
    const cell: TimerHandle[] = [];
    const handle: TimerHandle = realSetTimeout(
      (...callbackArgs: never[]) => {
        cell.forEach((armedHandle) => pendingHandles.delete(armedHandle));
        callback(...callbackArgs);
      },
      ms,
      ...args,
    );
    cell.push(handle);
    pendingHandles.add(handle);
    const armed: ArmedTimer = {
      ...armedTimerContract.parse({
        kind: 'setTimeout',
        stack: timerArmStackTransformer({ stack: new Error('armed').stack }),
      }),
      isPending: (): boolean => pendingHandles.has(handle) && isTimerHoldingLoopGuard({ handle }),
    };
    armListeners.forEach((listen) => {
      listen({ armed });
    });
    return handle;
  }) as typeof globalThis.setTimeout;

  // An interval has no moment of its own that ends it, so only a clear settles one.
  globalThis.setInterval = ((
    callback: (...callbackArgs: never[]) => void,
    ms?: number,
    ...args: never[]
  ) => {
    const handle: TimerHandle = realSetInterval(callback, ms, ...args);
    pendingHandles.add(handle);
    const armed: ArmedTimer = {
      ...armedTimerContract.parse({
        kind: 'setInterval',
        stack: timerArmStackTransformer({ stack: new Error('armed').stack }),
      }),
      isPending: (): boolean => pendingHandles.has(handle) && isTimerHoldingLoopGuard({ handle }),
    };
    armListeners.forEach((listen) => {
      listen({ armed });
    });
    return handle;
  }) as typeof globalThis.setInterval;

  // `Object.assign` rather than a bare cast: `typeof setImmediate` carries a `__promisify__`
  // property, and a plain function does not overlap with that enough for TypeScript to allow the
  // conversion at all.
  // Generic in its trailing arguments because node's own `setImmediate` is, and the Object.assign
  // intersection makes TypeScript compare the two signatures in full rather than loosely.
  globalThis.setImmediate = Object.assign(
    <TArgs extends unknown[]>(callback: (...callbackArgs: TArgs) => void, ...args: TArgs) => {
      const cell: TimerHandle[] = [];
      // Typed as node's own Immediate rather than TimerHandle: the Object.assign intersection makes
      // TypeScript compare the whole signature, and a return of `{}` does not overlap `Immediate`.
      const handle: ReturnType<typeof realSetImmediate> = realSetImmediate(
        (...callbackArgs: TArgs) => {
          cell.forEach((armedHandle) => pendingHandles.delete(armedHandle));
          callback(...callbackArgs);
        },
        ...args,
      );
      cell.push(handle);
      pendingHandles.add(handle);
      const armed: ArmedTimer = {
        ...armedTimerContract.parse({
          kind: 'setImmediate',
          stack: timerArmStackTransformer({ stack: new Error('armed').stack }),
        }),
        isPending: (): boolean => pendingHandles.has(handle) && isTimerHoldingLoopGuard({ handle }),
      };
      armListeners.forEach((listen) => {
        listen({ armed });
      });
      return handle;
    },
    { __promisify__: realSetImmediate.__promisify__ },
  ) as typeof globalThis.setImmediate;

  globalThis.clearTimeout = ((handle?: TimerHandle) => {
    pendingHandles.delete(handle ?? {});
    realClearTimeout(handle as Parameters<typeof realClearTimeout>[0]);
  }) as typeof globalThis.clearTimeout;

  globalThis.clearInterval = ((handle?: TimerHandle) => {
    pendingHandles.delete(handle ?? {});
    realClearInterval(handle as Parameters<typeof realClearInterval>[0]);
  }) as typeof globalThis.clearInterval;

  globalThis.clearImmediate = ((handle?: TimerHandle) => {
    pendingHandles.delete(handle ?? {});
    realClearImmediate(handle as Parameters<typeof realClearImmediate>[0]);
  }) as typeof globalThis.clearImmediate;

  return { success: true as const };
};
