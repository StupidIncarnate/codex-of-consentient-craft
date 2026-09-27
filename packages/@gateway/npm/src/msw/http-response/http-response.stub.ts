/**
 * PURPOSE: A real `HttpResponse`, built through the real `HttpResponse.json()` — for a caller
 * staging this subpath's own value instead of hand-typing a fake Response.
 *
 * USAGE:
 * const response = HttpResponseStub();
 * const body = await response.json();
 */
import { HttpResponse } from 'msw';

export const HttpResponseStub = ({
  body = { ok: true },
  status = 200,
}: {
  body?: Record<string, unknown>;
  status?: number;
} = {}): HttpResponse<Record<string, unknown>> => HttpResponse.json(body, { status });
