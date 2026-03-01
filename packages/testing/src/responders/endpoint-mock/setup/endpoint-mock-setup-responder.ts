/**
 * PURPOSE: Creates MSW server instance and returns lifecycle methods for test hook registration
 *
 * USAGE:
 * const lifecycle = EndpointMockSetupResponder();
 * // Returns { listen, resetHandlers, close } for use in jest hooks
 */

import type { EndpointMockLifecycle } from '../../../contracts/endpoint-mock-lifecycle/endpoint-mock-lifecycle-contract';
import { mswServerAdapter } from '../../../adapters/msw/server/msw-server-adapter';

export const EndpointMockSetupResponder = (): EndpointMockLifecycle => {
  const server = mswServerAdapter();

  return {
    listen: (): void => {
      server.listen({ onUnhandledRequest: 'error' });
    },
    resetHandlers: (): void => {
      server.resetHandlers();
    },
    close: (): void => {
      server.close();
    },
  };
};
