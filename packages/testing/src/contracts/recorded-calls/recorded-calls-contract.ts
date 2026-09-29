/**
 * PURPOSE: The read-only view `callsMatching([])` hands back for an unaddressed read — every
 * recorded call, with no `.at()` and no numeric index, so "take whatever ran last" cannot compile
 *
 * USAGE:
 * import type { RecordedCalls } from './recorded-calls-contract';
 */

import { z } from '#gateway/npm/zod';

// The schema exists for `.parse()` in the stub below, not for its inferred type: zod v4 infers a
// bare empty `z.object({})` as `Record<string, never>`, which an array-shaped value (see
// `RecordedCalls` below) can never satisfy, so the exported type is hand-written instead of
// intersected with `z.infer<typeof recordedCallsContract>`.
export const recordedCallsContract = z.object({});

export type RecordedCalls = Readonly<Pick<unknown[][], 'length'>> & {
  map: <U>(fn: (call: unknown[], index: number) => U) => U[];
  filter: (fn: (call: unknown[], index: number) => boolean) => unknown[][];
  [Symbol.iterator]: () => IterableIterator<unknown[]>;
};
