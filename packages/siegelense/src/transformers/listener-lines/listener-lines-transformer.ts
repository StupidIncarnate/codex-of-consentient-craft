/**
 * PURPOSE: Pure JSON-line builders for the console, pageerror, network (response + requestfailed)
 * and websocket events `browser-session-launch-broker` listens for. This file touches no Playwright
 * object and imports nothing from `@playwright/test` — the session arms every `page.on(...)`
 * listener itself, extracts each event's fields, and hands this transformer plain values to shape
 * into the `ContentText` line it pushes onto a buffer.
 *
 * USAGE:
 * const linesBuild = listenerLinesTransformer();
 * linesBuild.consoleLine({ at: EpochMsStub({}), type: 'log', text: 'hi', url: 'http://x', line: 1 });
 * // Returns a ContentText JSON line, ready to push onto the console buffer
 */

// Reading a response body costs a round trip to the browser, and a bundle's body answers no
// question a siege asks. Matches `siege-lane.ts`'s own BODY_SKIP_RESOURCE_TYPES.
const BODY_SKIP_RESOURCE_TYPES = new Set(['script', 'stylesheet', 'image', 'font', 'media']);
// Response and websocket-frame bodies are the reason this driver exists, so the cap is high enough
// to hold a whole quest.json rather than a preview of one. Matches `siege-lane.ts`'s MAX_BODY_CHARS.
const MAX_BODY_CHARS = 200_000;
const SKIPPED_BODY_TEXT = '<body not captured for this resource type>';

export const listenerLinesTransformer = (): {
  isBodySkippedResourceType: (params: { resourceType: string }) => boolean;
  skippedBodyPlaceholder: () => string;
  unavailableBodyPlaceholder: (params: { error: unknown }) => string;
  truncatedBody: (params: { text: string }) => string;
  truncatePayload: (params: { text: string }) => string;
  consoleLine: (params: {
    at: number;
    type: string;
    text: string;
    url: string;
    line: number;
  }) => string;
  pageErrorLine: (params: {
    at: number;
    type: string;
    text: string;
    stack: string | null;
  }) => string;
  networkLine: (params: {
    at: number;
    method: string;
    url: string;
    resourceType: string;
    status: number | null;
    requestBody: string | null;
    responseBody: string;
  }) => string;
  requestFailedLine: (params: {
    at: number;
    method: string;
    url: string;
    resourceType: string;
    requestBody: string | null;
    errorText: string;
  }) => string;
  websocketFrameLine: (params: {
    at: number;
    url: string;
    direction: 'sent' | 'received';
    payload: string;
  }) => string;
  websocketCloseLine: (params: { at: number; url: string }) => string;
} => ({
  isBodySkippedResourceType: ({ resourceType }): boolean =>
    BODY_SKIP_RESOURCE_TYPES.has(resourceType),

  skippedBodyPlaceholder: (): string => SKIPPED_BODY_TEXT,

  unavailableBodyPlaceholder: ({ error }): string => `<body unavailable: ${String(error)}>`,

  truncatedBody: ({ text }): string => text.slice(0, MAX_BODY_CHARS),

  truncatePayload: ({ text }): string => text.slice(0, MAX_BODY_CHARS),

  consoleLine: ({ at, type, text, url, line }): string =>
    JSON.stringify({ at, kind: 'console', type, text, url, line }),

  pageErrorLine: ({ at, type, text, stack }): string =>
    JSON.stringify({ at, kind: 'pageerror', type, text, stack }),

  networkLine: ({ at, method, url, resourceType, status, requestBody, responseBody }): string =>
    JSON.stringify({ at, method, url, resourceType, status, requestBody, responseBody }),

  requestFailedLine: ({ at, method, url, resourceType, requestBody, errorText }): string =>
    JSON.stringify({
      at,
      method,
      url,
      resourceType,
      status: null,
      requestBody,
      responseBody: `<request failed: ${errorText}>`,
    }),

  websocketFrameLine: ({ at, url, direction, payload }): string =>
    JSON.stringify({ at, url, direction, payload }),

  websocketCloseLine: ({ at, url }): string =>
    JSON.stringify({ at, url, direction: 'closed', payload: '' }),
});
