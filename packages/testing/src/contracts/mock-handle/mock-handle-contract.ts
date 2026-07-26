/**
 * PURPOSE: Defines the handle returned by registerMock/registerSpyOn — argument-addressed staging plus the call-order API
 *
 * USAGE:
 * import type { MockHandle } from './mock-handle-contract';
 */

import { z } from 'zod';

import type { MockStaging } from '../mock-staging/mock-staging-contract';
import type { RecordedCalls } from '../recorded-calls/recorded-calls-contract';

export const mockHandleContract = z.object({});

export type MockHandle = z.infer<typeof mockHandleContract> & {
  calledWith: (args: readonly unknown[]) => MockStaging;
  onceFor: (args: readonly unknown[]) => MockStaging;
  // Two overloads, in this order — overload resolution picks the FIRST match:
  // 1. A literal `[]` (no address) narrows to RecordedCalls — no `.at()`, no numeric index, so
  //    "take whatever ran last" out of an unfiltered read cannot compile.
  // 2. Everything else — a literal non-empty tuple (a real address) OR a dynamic (non-literal)
  //    argument — keeps the full array, so `.at(-1)` stays legal once the read is addressed.
  //    (A third overload narrowing the tuple case specifically would return the same
  //    `unknown[][]` as this one — @typescript-eslint/unified-signatures rejects that as a
  //    redundant split.)
  callsMatching: {
    (args: readonly []): RecordedCalls;
    (args: readonly unknown[]): unknown[][];
  };
};
