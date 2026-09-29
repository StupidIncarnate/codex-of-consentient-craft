/**
 * PURPOSE: Holds the one MSW node server every endpoint-mock responder and the network recorder
 * share. It is created once per module registry, so a handler staged by the listen responder is
 * the same handler the setup responder's lifecycle listens on and the capture broker observes.
 *
 * USAGE:
 * const server = mswServerState.get();
 * server.listen({ onUnhandledRequest: 'bypass' });
 */

import { setupServer } from '#gateway/npm/msw__node';
import type { SetupServer } from '#gateway/npm/msw__node';

const serverInstance = setupServer();

export const mswServerState = {
  get: (): SetupServer => serverInstance,
} as const;
