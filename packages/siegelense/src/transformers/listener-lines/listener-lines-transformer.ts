/**
 * PURPOSE: Pure JSON-line builders for the console, pageerror, network (response + requestfailed)
 * and websocket events `playwright-session-adapter` listens for. This file touches no Playwright
 * object and imports nothing from `@playwright/test` — the session arms every `page.on(...)`
 * listener itself, extracts each event's fields, and hands this transformer plain values to shape
 * into the `ContentText` line it pushes onto a buffer.
 *
 * USAGE:
 * const linesBuild = listenerLinesTransformer();
 * linesBuild.consoleLine({ at: EpochMsStub({}), type: 'log', text: 'hi', url: 'http://x', line: 1 });
 * // Returns a ContentText JSON line, ready to push onto the console buffer
 */

import { contentTextContract } from '@dungeonmaster/shared/contracts';
import type { ContentText } from '@dungeonmaster/shared/contracts';

import type { EpochMs } from '../../contracts/epoch-ms/epoch-ms-contract';

// Reading a response body costs a round trip to the browser, and a bundle's body answers no
// question a siege asks. Matches `siege-lane.ts`'s own BODY_SKIP_RESOURCE_TYPES.
const BODY_SKIP_RESOURCE_TYPES = new Set(['script', 'stylesheet', 'image', 'font', 'media']);
// Response and websocket-frame bodies are the reason this driver exists, so the cap is high enough
// to hold a whole quest.json rather than a preview of one. Matches `siege-lane.ts`'s MAX_BODY_CHARS.
const MAX_BODY_CHARS = 200_000;
const SKIPPED_BODY_TEXT = '<body not captured for this resource type>';

export const listenerLinesTransformer = (): {
  isBodySkippedResourceType: (params: { resourceType: string }) => boolean;
  skippedBodyPlaceholder: () => ContentText;
  unavailableBodyPlaceholder: (params: { error: unknown }) => ContentText;
  truncatedBody: (params: { text: string }) => ContentText;
  truncatePayload: (params: { text: string }) => ContentText;
  consoleLine: (params: {
    at: EpochMs;
    type: string;
    text: string;
    url: string;
    line: number;
  }) => ContentText;
  pageErrorLine: (params: {
    at: EpochMs;
    type: string;
    text: string;
    stack: string | null;
  }) => ContentText;
  networkLine: (params: {
    at: EpochMs;
    method: string;
    url: string;
    resourceType: string;
    status: number | null;
    requestBody: string | null;
    responseBody: ContentText;
  }) => ContentText;
  requestFailedLine: (params: {
    at: EpochMs;
    method: string;
    url: string;
    resourceType: string;
    requestBody: string | null;
    errorText: string;
  }) => ContentText;
  websocketFrameLine: (params: {
    at: EpochMs;
    url: string;
    direction: 'sent' | 'received';
    payload: ContentText;
  }) => ContentText;
  websocketCloseLine: (params: { at: EpochMs; url: string }) => ContentText;
} => ({
  isBodySkippedResourceType: ({ resourceType }): boolean =>
    BODY_SKIP_RESOURCE_TYPES.has(resourceType),

  skippedBodyPlaceholder: (): ContentText => contentTextContract.parse(SKIPPED_BODY_TEXT),

  unavailableBodyPlaceholder: ({ error }): ContentText =>
    contentTextContract.parse(`<body unavailable: ${String(error)}>`),

  truncatedBody: ({ text }): ContentText =>
    contentTextContract.parse(text.slice(0, MAX_BODY_CHARS)),

  truncatePayload: ({ text }): ContentText =>
    contentTextContract.parse(text.slice(0, MAX_BODY_CHARS)),

  consoleLine: ({ at, type, text, url, line }): ContentText =>
    contentTextContract.parse(JSON.stringify({ at, kind: 'console', type, text, url, line })),

  pageErrorLine: ({ at, type, text, stack }): ContentText =>
    contentTextContract.parse(JSON.stringify({ at, kind: 'pageerror', type, text, stack })),

  networkLine: ({
    at,
    method,
    url,
    resourceType,
    status,
    requestBody,
    responseBody,
  }): ContentText =>
    contentTextContract.parse(
      JSON.stringify({ at, method, url, resourceType, status, requestBody, responseBody }),
    ),

  requestFailedLine: ({ at, method, url, resourceType, requestBody, errorText }): ContentText =>
    contentTextContract.parse(
      JSON.stringify({
        at,
        method,
        url,
        resourceType,
        status: null,
        requestBody,
        responseBody: `<request failed: ${errorText}>`,
      }),
    ),

  websocketFrameLine: ({ at, url, direction, payload }): ContentText =>
    contentTextContract.parse(JSON.stringify({ at, url, direction, payload })),

  websocketCloseLine: ({ at, url }): ContentText =>
    contentTextContract.parse(JSON.stringify({ at, url, direction: 'closed', payload: '' })),
});
