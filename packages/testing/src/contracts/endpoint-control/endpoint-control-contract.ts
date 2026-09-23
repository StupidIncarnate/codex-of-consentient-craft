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
  // Answers with `data` only once `release()` is called, so a test can assert in-flight UI state
  // (a disabled button, a spinner) that a same-tick `resolves()` settles too fast to observe.
  holdsOpen: (params: { data: unknown }) => { release: () => void };
  getRequestCount: () => RequestCount;
  // Parsed JSON bodies of the requests this endpoint received, oldest first. Lets a test assert
  // WHAT the frontend sent, not merely that it sent something — a request-count-only assertion
  // passes just as happily when a field the user selected never reached the wire.
  getRequestBodies: () => Promise<unknown[]>;
};
