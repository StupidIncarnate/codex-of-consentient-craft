/**
 * PURPOSE: Provides centralized HTTP mocking for tests via MSW, replacing direct fetch mocking in proxy files
 *
 * USAGE:
 * const endpoint = StartEndpointMock.listen({ method: 'get', url: '/api/guilds' });
 * endpoint.resolves({ data: [{ id: '123', name: 'My Guild' }] });
 */

import { EndpointMockFlow } from '../flows/endpoint-mock/endpoint-mock-flow';

export const StartEndpointMock = EndpointMockFlow;
