/**
 * PURPOSE: Orchestrates endpoint mock setup by delegating to the endpoint-mock-setup responder
 *
 * USAGE:
 * const lifecycle = EndpointMockSetupFlow();
 * // Returns { listen, resetHandlers, close } for jest hook registration
 */

import { EndpointMockSetupResponder } from '../../responders/endpoint-mock/setup/endpoint-mock-setup-responder';

type FlowResult = ReturnType<typeof EndpointMockSetupResponder>;

export const EndpointMockSetupFlow = (): FlowResult => EndpointMockSetupResponder();
