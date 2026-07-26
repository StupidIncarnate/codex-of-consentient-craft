/**
 * PURPOSE: Builds the MockStaging object that calledWith()/onceFor() hand back, wiring each method to set what the described call answers with
 *
 * USAGE:
 * const staging = mockStagingCreateTransformer({ record });
 * staging.resolves('quest-json');
 * // record.impl now resolves to 'quest-json' when the described call is dispatched
 */

import type { MockStaging } from '../../contracts/mock-staging/mock-staging-contract';
import type { StagedCall } from '../../contracts/staged-call/staged-call-contract';

type ImplField = StagedCall['impl'];

export const mockStagingCreateTransformer = ({ record }: { record: StagedCall }): MockStaging => ({
  returns: (val: unknown): void => {
    record.impl = (): unknown => val;
  },
  // `async` is mandatory here — `@typescript-eslint/promise-function-async` requires it because
  // this returns a Promise, and `@typescript-eslint/require-await` then requires a real `await`
  // inside the body (an async arrow that just does `=> val` / `=> { throw reason }` fails that
  // rule). Given both constraints, `record.impl` MUST contain an `await`. The form matters for
  // timing: `async () => Promise.resolve(val)` / `Promise.reject(reason)` returns a second,
  // already-settled promise for the async wrapper to adopt, which costs an EXTRA microtask tick
  // (V8 schedules a PromiseResolveThenableJob to assimilate it) on top of the one tick every
  // async function call already costs. Awaiting a plain (non-thenable) value/no-op instead —
  // `await val` / `await Promise.resolve()` before throwing — satisfies require-await without
  // that second hop, so a caller's chained `.then()`/`.catch()` needs exactly two
  // `await Promise.resolve()` ticks to observe it, not three.
  resolves: (val: unknown): void => {
    record.impl = async (): Promise<unknown> => await val;
  },
  rejects: (val: unknown): void => {
    const reason = val instanceof Error ? val : new Error(String(val));
    record.impl = async (): Promise<unknown> => {
      await Promise.resolve();
      throw reason;
    };
  },
  throws: (val: unknown): void => {
    const reason = val instanceof Error ? val : new Error(String(val));
    record.impl = (): never => {
      throw reason;
    };
  },
  implement: (impl: (...args: never[]) => unknown): void => {
    record.impl = impl as ImplField;
  },
});
