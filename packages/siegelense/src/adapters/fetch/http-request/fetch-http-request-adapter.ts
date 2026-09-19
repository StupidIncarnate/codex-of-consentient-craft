/**
 * PURPOSE: Performs an HTTP request via `globalThis.fetch` with timeout control, automatic
 * JSON serialization of non-string request bodies, content-type header defaults, and robust
 * response reading that attempts JSON parsing before falling back to raw text. Reach for this
 * over calling `globalThis.fetch` directly so HTTP exchange operations stay uniform and produce
 * validated HttpRequestReading contracts.
 *
 * USAGE:
 * await fetchHttpRequestAdapter({
 *   url: 'http://127.0.0.1:34172/api/guilds',
 *   method: 'POST',
 *   body: { name: 'guild-1' },
 * });
 * // Serializes body, sets application/json, and returns HttpRequestReading
 */

import { httpRequestReadingContract } from '../../../contracts/http-request-reading/http-request-reading-contract';
import type { HttpRequestReading } from '../../../contracts/http-request-reading/http-request-reading-contract';
import { requestStatics } from '../../../statics/request/request-statics';

export const fetchHttpRequestAdapter = async ({
  url,
  method,
  headers,
  body,
  timeoutMs,
}: {
  url: string;
  method: string;
  headers?: Record<PropertyKey, unknown>;
  body?: unknown;
  timeoutMs?: number;
}): Promise<HttpRequestReading> => {
  const requestHeaders: Record<PropertyKey, unknown> = { ...headers };

  const effectiveBody = body === undefined ? null : body;
  const isObjectBody = effectiveBody !== null && typeof effectiveBody !== 'string';
  const requestBody: BodyInit | null =
    effectiveBody === null
      ? null
      : typeof effectiveBody === 'string'
        ? effectiveBody
        : JSON.stringify(effectiveBody);

  if (isObjectBody) {
    const hasContentType = Object.keys(requestHeaders).some(
      (key) => key.toLowerCase() === 'content-type',
    );
    if (!hasContentType) {
      requestHeaders['content-type'] = 'application/json';
    }
  }

  const controller = new AbortController();
  const effectiveTimeout = timeoutMs ?? requestStatics.defaults.timeoutMs;
  const timer = setTimeout(() => {
    controller.abort();
  }, effectiveTimeout);

  try {
    const response = await globalThis.fetch(url, {
      method,
      headers: requestHeaders as HeadersInit,
      ...(requestBody === null ? {} : { body: requestBody }),
      signal: controller.signal,
    });

    const responseHeaders: Record<PropertyKey, unknown> = {};
    response.headers.forEach((value, key) => {
      responseHeaders[key] = value;
    });

    const text = await response.text();
    let parsedBody: unknown = text;
    try {
      parsedBody = JSON.parse(text);
    } catch {
      // Fall back to raw text if response body is not JSON
    }

    return httpRequestReadingContract.parse({
      status: response.status,
      statusText: response.statusText,
      headers: responseHeaders,
      body: parsedBody,
    });
  } finally {
    clearTimeout(timer);
  }
};
