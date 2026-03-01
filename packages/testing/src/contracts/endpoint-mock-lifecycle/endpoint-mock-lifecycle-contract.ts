/**
 * PURPOSE: Defines the lifecycle interface for MSW endpoint mock server management
 *
 * USAGE:
 * import type { EndpointMockLifecycle } from './endpoint-mock-lifecycle-contract';
 * // { listen, resetHandlers, close }
 */

import { z } from 'zod';

export const endpointMockLifecycleContract = z.object({});

export type EndpointMockLifecycle = z.infer<typeof endpointMockLifecycleContract> & {
  listen: () => void;
  resetHandlers: () => void;
  close: () => void;
};
