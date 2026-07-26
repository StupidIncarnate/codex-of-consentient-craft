/**
 * PURPOSE: Defines the object returned by MockHandle.calledWith()/.onceFor() for setting what a described call answers with
 *
 * USAGE:
 * import type { MockStaging } from './mock-staging-contract';
 */

import { z } from 'zod';

export const mockStagingContract = z.object({});

export type MockStaging = z.infer<typeof mockStagingContract> & {
  returns: (val: unknown) => void;
  resolves: (val: unknown) => void;
  rejects: (val: unknown) => void;
  throws: (val: unknown) => void;
  implement: (impl: (...args: never[]) => unknown) => void;
};
