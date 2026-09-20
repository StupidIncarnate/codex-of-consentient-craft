/**
 * PURPOSE: Thrown when an HTTP request step receives a non-2xx/3xx response (HTTP status >= 400),
 * packaging the status code, status text, response body, and target URL into a structured error.
 * Reach for this over a generic Error so the step dispatcher and results query can distinguish
 * HTTP-level refusals from network timeouts or process crashes.
 *
 * USAGE:
 * throw new HttpRequestFailedError({
 *   status: 404,
 *   statusText: 'Not Found',
 *   body: '{"error":"Not found"}',
 *   url: 'http://127.0.0.1:34172/api/unknown',
 * });
 */

export class HttpRequestFailedError extends Error {
  public readonly status: unknown;

  public readonly statusText: unknown;

  public readonly body: unknown;

  public readonly url: unknown;

  public constructor({
    status,
    statusText,
    body,
    url,
  }: {
    status: number;
    statusText: string;
    body: string;
    url: string;
  }) {
    super(`HTTP ${String(status)} ${statusText} from ${url}: ${body}`);
    this.status = status;
    this.statusText = statusText;
    this.body = body;
    this.url = url;
    this.name = 'HttpRequestFailedError';
  }
}
