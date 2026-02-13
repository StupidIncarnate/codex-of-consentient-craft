/**
 * PURPOSE: Defines the EndpointControl interface returned by StartEndpointMock.listen() and the HttpMethod union type
 *
 * USAGE:
 * import type { EndpointControl, HttpMethod } from './endpoint-control-contract';
 */

import { z } from 'zod';

export const endpointControlContract = z.object({});

export type HttpMethod = 'delete' | 'get' | 'head' | 'options' | 'patch' | 'post' | 'put';

export type EndpointControl = z.infer<typeof endpointControlContract> & {
  resolves: (params: { data: unknown }) => void;
  responds: (params: { status: number; body?: unknown }) => void;
  respondRaw: (params: {
    status: number;
    body: BodyInit | null;
    headers: Record<string, string>;
  }) => void;
  networkError: () => void;
};
