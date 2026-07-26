/**
 * PURPOSE: Defines the handle returned by registerMock/registerSpyOn — argument-addressed staging plus the call-order API
 *
 * USAGE:
 * import type { MockHandle } from './mock-handle-contract';
 */

import { z } from 'zod';

import type { MockStaging } from '../mock-staging/mock-staging-contract';

export const mockHandleContract = z.object({});

export type MockHandle = z.infer<typeof mockHandleContract> & {
  calledWith: (args: readonly unknown[]) => MockStaging;
  onceFor: (args: readonly unknown[]) => MockStaging;
  callsMatching: (args: readonly unknown[]) => unknown[][];
};
