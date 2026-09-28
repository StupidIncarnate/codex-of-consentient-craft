/**
 * PURPOSE: Proxy for page-events-layer-broker — a stand-in Playwright Page that records the handler
 * registered for each event, and emit methods that fire those handlers with Playwright-shaped
 * requests, responses and websocket frames.
 *
 * USAGE:
 * const proxy = pageEventsLayerBrokerProxy();
 * pageEventsLayerBroker({ page: proxy.getPage(), ...callbacks });
 * proxy.emitResponse({ url, method, status, contentType, body });
 */

import type { Page } from '#gateway/npm/playwright__test';

type Handler = (...args: readonly unknown[]) => void;

export const pageEventsLayerBrokerProxy = (): {
  getPage: () => Page;
  emitRequest: (params: { url: string; method: string; postData: string | null }) => unknown;
  emitResponse: (params: {
    url: string;
    method: string;
    status: number;
    contentType?: string;
    body: string;
  }) => unknown;
  emitRequestFailed: (params: { url: string; method: string; errorText: string | null }) => unknown;
  emitWebSocketFrame: (params: {
    direction: 'sent' | 'received';
    payload: string | Buffer;
  }) => void;
} => {
  const pageHandlers = new Map<unknown, Handler>();
  const wsHandlers = new Map<unknown, Handler>();
  const ws = {
    on: (event: unknown, handler: Handler): void => {
      wsHandlers.set(event, handler);
    },
  };
  const page = {
    on: (event: unknown, handler: Handler): void => {
      pageHandlers.set(event, handler);
    },
  };

  const requestOf = ({
    url,
    method,
    postData,
    errorText,
  }: {
    url: unknown;
    method: unknown;
    postData?: unknown;
    errorText?: unknown;
  }): {
    url: () => unknown;
    method: () => unknown;
    postData: () => unknown;
    failure: () => unknown;
  } => ({
    url: () => url,
    method: () => method,
    postData: () => postData ?? null,
    failure: () => (errorText === null || errorText === undefined ? null : { errorText }),
  });

  return {
    getPage: (): Page => page as never,

    emitRequest: ({ url, method, postData }): unknown => {
      const request = requestOf({ url, method, postData });
      pageHandlers.get('request')?.(request);
      return request;
    },

    emitResponse: ({ url, method, status, contentType, body }): unknown => {
      const request = requestOf({ url, method });
      pageHandlers.get('response')?.({
        request: () => request,
        status: () => status,
        headers: () => (contentType === undefined ? {} : { 'content-type': contentType }),
        text: async () => Promise.resolve(body),
      });
      return request;
    },

    emitRequestFailed: ({ url, method, errorText }): unknown => {
      const request = requestOf({ url, method, errorText });
      pageHandlers.get('requestfailed')?.(request);
      return request;
    },

    emitWebSocketFrame: ({ direction, payload }): void => {
      pageHandlers.get('websocket')?.(ws);
      wsHandlers.get(direction === 'received' ? 'framereceived' : 'framesent')?.({ payload });
    },
  };
};
