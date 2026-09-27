/**
 * PURPOSE: Orchestrates endpoint mock setup by delegating to the endpoint-mock-setup responder
 *
 * USAGE:
 * const lifecycle = EndpointMockSetupFlow({ testPath: expect.getState().testPath });
 * // Returns { listen, resetHandlers, close, assertNoUnhandledRequests } for jest hook registration
 */

import { EndpointMockSetupResponder } from '../../responders/endpoint-mock/setup/endpoint-mock-setup-responder';

type FlowResult = ReturnType<typeof EndpointMockSetupResponder>;

// `exactOptionalPropertyTypes` refuses `{ testPath: undefined }` for an optional key — forwarding an
// already-optional param means OMITTING the key when unset, never assigning it `undefined`.
export const EndpointMockSetupFlow = ({ testPath }: { testPath?: string } = {}): FlowResult =>
  EndpointMockSetupResponder(testPath === undefined ? {} : { testPath });
