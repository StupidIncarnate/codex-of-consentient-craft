/**
 * PURPOSE: Defines the lifecycle interface for MSW endpoint mock server management
 *
 * USAGE:
 * import type { EndpointMockLifecycle } from './endpoint-mock-lifecycle-contract';
 * // { listen, resetHandlers, close, assertNoUnhandledRequests }
 */

import { z } from 'zod';

// `.loose()` keeps `z.infer` of the empty shape from narrowing to `Record<string, never>` (zod
// v4), which the function-carrying intersection below could never satisfy.
export const endpointMockLifecycleContract = z.object({}).loose();

export type EndpointMockLifecycle = z.infer<typeof endpointMockLifecycleContract> & {
  listen: () => void;
  resetHandlers: () => void;
  close: () => void;
  // Throws when the test that just ran made an HTTP request or opened a WebSocket connection
  // nothing staged — read independently of any rejection the code under test may have caught, and
  // clears its own record on every call, so the next test starts clean.
  assertNoUnhandledRequests: () => void;
};
