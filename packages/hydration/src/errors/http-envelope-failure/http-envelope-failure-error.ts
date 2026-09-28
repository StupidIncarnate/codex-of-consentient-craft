/**
 * PURPOSE: Represents an HTTP envelope failure when an HTTP response arrives with a non-2xx status code.
 * Carries url, status, and serialized body for consumption by routeFailureTransformer.
 *
 * USAGE:
 * throw new HttpEnvelopeFailureError({
 *   url: 'http://localhost:3737/api/guilds',
 *   status: 500,
 *   body: '{"error":"database unavailable"}',
 * });
 * // Throws HttpEnvelopeFailureError carrying url, status, and body
 */
export class HttpEnvelopeFailureError extends Error {
  public readonly url: string;
  public readonly status: number;
  public readonly body: string;

  public constructor({ url, status, body }: { url: string; status: number; body: string }) {
    super(`${url} answered ${String(status)}`);
    this.name = 'HttpEnvelopeFailureError';
    this.url = url;
    this.status = status;
    this.body = body;
  }
}
