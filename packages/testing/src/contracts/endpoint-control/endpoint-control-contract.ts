/**
 * PURPOSE: Defines the EndpointControl interface returned by StartEndpointMock.listen() and the HttpMethod union type
 *
 * USAGE:
 * import type { EndpointControl, HttpMethod } from './endpoint-control-contract';
 */

import { z } from 'zod';

import type { RequestCount } from '../request-count/request-count-contract';

// `.loose()` keeps `z.infer` of the empty shape from narrowing to `Record<string, never>` (zod
// v4), which the function-carrying intersection below could never satisfy.
export const endpointControlContract = z.object({}).loose();

export type HttpMethod = 'delete' | 'get' | 'head' | 'options' | 'patch' | 'post' | 'put';

// Structural, not a zod schema itself: any zod object's `.parse` satisfies this shape, so a
// serving package's own response contract (e.g. `commentBatchResponseContract`) can be passed to
// `StartEndpointMock.listen()` without this package depending on that contract's type.
export interface EndpointResponseContract {
  parse: (value: unknown) => unknown;
}

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
  // `data` is JSON-encoded; `rawBody` is released verbatim (text, HTML) and wins when both are given.
  holdsOpen: (params: { data?: unknown; rawBody?: string }) => { release: () => void };
  getRequestCount: () => RequestCount;
  // Parsed JSON bodies of the requests this endpoint received, oldest first. Lets a test assert
  // WHAT the frontend sent, not merely that it sent something — a request-count-only assertion
  // passes just as happily when a field the user selected never reached the wire.
  getRequestBodies: () => Promise<unknown[]>;
};
