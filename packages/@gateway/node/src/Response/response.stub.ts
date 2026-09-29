/**
 * PURPOSE: A real `Response` carrying a plain-text body, status and headers — for a caller that
 * needs a genuine response and is not staging JSON (`#gateway/node/fetch`'s `FetchResponseStub`
 * covers that). An empty body is passed as `null`, which is what a no-content status requires.
 *
 * USAGE:
 * const response = ResponseStub({ body: 'not found', status: 404, headers: { 'x-id': 'a' } });
 */
import { Response } from './Response';

export const ResponseStub = ({
  body = '',
  status = 200,
  headers = {},
}: { body?: string; status?: number; headers?: Record<string, string> } = {}): Response =>
  new Response(body === '' ? null : body, { status, headers });
