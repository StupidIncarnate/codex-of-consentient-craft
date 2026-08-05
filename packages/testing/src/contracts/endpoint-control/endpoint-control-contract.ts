/**
 * PURPOSE: Defines the EndpointControl interface returned by StartEndpointMock.listen() and the HttpMethod union type
 *
 * USAGE:
 * import type { EndpointControl, HttpMethod } from './endpoint-control-contract';
 */

import { z } from 'zod';

import type { RequestCount } from '../request-count/request-count-contract';

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
  getRequestCount: () => RequestCount;
  // Parsed JSON bodies of the requests this endpoint received, oldest first. Lets a test assert
  // WHAT the frontend sent, not merely that it sent something — a request-count-only assertion
  // passes just as happily when a field the user selected never reached the wire.
  getRequestBodies: () => Promise<unknown[]>;
};
