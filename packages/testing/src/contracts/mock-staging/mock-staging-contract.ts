/**
 * PURPOSE: Defines the object returned by MockHandle.calledWith()/.onceFor() for setting what a described call answers with
 *
 * USAGE:
 * import type { MockStaging } from './mock-staging-contract';
 */

import { z } from '#gateway/npm/zod';

// `.loose()` keeps `z.infer` of the empty shape from narrowing to `Record<string, never>` (zod
// v4), which the function-carrying intersection below could never satisfy.
export const mockStagingContract = z.object({}).loose();

export type MockStaging = z.infer<typeof mockStagingContract> & {
  returns: (val: unknown) => void;
  resolves: (val: unknown) => void;
  rejects: (val: unknown) => void;
  throws: (val: unknown) => void;
  implement: (impl: (...args: never[]) => unknown) => void;
};
