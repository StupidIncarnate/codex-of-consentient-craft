/**
 * PURPOSE: Wraps MSW setupServer to provide a singleton mock HTTP server for intercepting fetch requests in tests
 *
 * USAGE:
 * const server = mswServerAdapter();
 * server.listen({ onUnhandledRequest: 'bypass' });
 */

import { setupServer } from 'msw/node';
import type { SetupServer } from 'msw/node';

const serverInstance = setupServer();

export const mswServerAdapter = (): SetupServer => serverInstance;
