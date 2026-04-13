/**
 * PURPOSE: Wraps Playwright Page event subscription for network traffic and WebSocket monitoring
 *
 * USAGE:
 * playwrightPageEventsAdapter({ page, onRequest, onResponse, onRequestFailed, onWebSocketFrame });
 * // Subscribes to Playwright Page events using provided callbacks
 */

import type { Page, Request as PlaywrightRequest } from '@playwright/test';
import type { AdapterResult } from '@dungeonmaster/shared/contracts';
import type { NetworkLogEntry } from '../../../contracts/network-log-entry/network-log-entry-contract';

export const playwrightPageEventsAdapter = ({
  page,
  onRequest,
  onResponse,
  onRequestFailed,
  onWebSocketFrame,
}: {
  page: Page;
  onRequest: (args: {
    url: string;
    method: string;
    postData: string | null;
    requestIdentity: PlaywrightRequest;
  }) => void;
  onResponse: (args: {
    url: string;
    method: string;
    status: number;
    hasCapturableBody: boolean;
    text: () => Promise<NetworkLogEntry['responseBody']>;
    requestIdentity: PlaywrightRequest;
  }) => void;
  onRequestFailed: (args: {
    url: string;
    method: string;
    errorText: NetworkLogEntry['error'];
    requestIdentity: PlaywrightRequest;
  }) => void;
  onWebSocketFrame: (args: { direction: 'sent' | 'received'; payload: string | Buffer }) => void;
}): AdapterResult => {
  page.on('request', (request) => {
    onRequest({
      url: request.url(),
      method: request.method(),
      postData: request.postData(),
      requestIdentity: request,
    });
  });

  page.on('response', (response) => {
    const request = response.request();
    const contentType = response.headers()['content-type'] ?? '';
    const hasCapturableBody =
      contentType.includes('application/json') || contentType.includes('text/');

    onResponse({
      url: request.url(),
      method: request.method(),
      status: response.status(),
      hasCapturableBody,
      text: async () => response.text() as Promise<NetworkLogEntry['responseBody']>,
      requestIdentity: request,
    });
  });

  page.on('requestfailed', (request) => {
    const failure = request.failure();
    onRequestFailed({
      url: request.url(),
      method: request.method(),
      errorText: failure?.errorText as NetworkLogEntry['error'],
      requestIdentity: request,
    });
  });

  page.on('websocket', (ws) => {
    ws.on('framereceived', (data) => {
      onWebSocketFrame({ direction: 'received', payload: data.payload });
    });

    ws.on('framesent', (data) => {
      onWebSocketFrame({ direction: 'sent', payload: data.payload });
    });
  });

  return { success: true as const };
};
