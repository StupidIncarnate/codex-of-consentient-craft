/**
 * PURPOSE: The read-only view `callsMatching([])` hands back for an unaddressed read — every
 * recorded call, with no `.at()` and no numeric index, so "take whatever ran last" cannot compile
 *
 * USAGE:
 * import type { RecordedCalls } from './recorded-calls-contract';
 */

import { z } from 'zod';

export const recordedCallsContract = z.object({});

export type RecordedCalls = z.infer<typeof recordedCallsContract> &
  Readonly<Pick<unknown[][], 'length'>> & {
    map: <U>(fn: (call: unknown[], index: number) => U) => U[];
    filter: (fn: (call: unknown[], index: number) => boolean) => unknown[][];
    [Symbol.iterator]: () => IterableIterator<unknown[]>;
  };
