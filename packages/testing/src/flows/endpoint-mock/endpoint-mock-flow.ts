/**
 * PURPOSE: Delegates endpoint mock creation to the listen responder, providing the public API for HTTP mocking in tests
 *
 * USAGE:
 * const endpoint = EndpointMockFlow.listen({ method: 'get', url: '/api/guilds' });
 * endpoint.resolves({ data: [{ id: '123' }] });
 */

import { EndpointMockListenResponder } from '../../responders/endpoint-mock/listen/endpoint-mock-listen-responder';

type ResponderParams = Parameters<typeof EndpointMockListenResponder>[0];
type ResponderResult = ReturnType<typeof EndpointMockListenResponder>;

export const EndpointMockFlow = {
  listen: ({ method, url }: ResponderParams): ResponderResult =>
    EndpointMockListenResponder({ method, url }),
};
