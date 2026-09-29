/**
 * PURPOSE: Proxy for network-record-playwright-broker that captures page event handlers for testing
 *
 * USAGE:
 * const proxy = networkRecordPlaywrightBrokerProxy();
 * const recorder = networkRecordPlaywrightBroker({ page: proxy.getPage() });
 * proxy.fireResponse({ ... });
 */

import { stderrProxy } from '#gateway/node/process/stderr/stderr.proxy';

import type { pageEventsLayerBroker } from './page-events-layer-broker';
import { pageEventsLayerBrokerProxy } from './page-events-layer-broker.proxy';

type AdapterParams = Parameters<typeof pageEventsLayerBroker>[0];
type OnResponseArgs = Parameters<AdapterParams['onResponse']>[0];
type OnRequestArgs = Parameters<AdapterParams['onRequest']>[0];
type PageHandler = (...args: readonly unknown[]) => void;

export const networkRecordPlaywrightBrokerProxy = (): {
  getPage: () => { on: jest.Mock };
  fireResponse: (args: OnResponseArgs) => void;
  fireRequest: (args: OnRequestArgs) => void;
  getStderrWrites: () => readonly unknown[];
  getTestInfo: (args: { status: 'passed' | 'failed' }) => never;
  getAttachCalls: () => readonly unknown[][];
} => {
  pageEventsLayerBrokerProxy();
  const stderrChild = stderrProxy();
  const attachCalls: unknown[][] = [];
  const capturedResponseHandler: { current: PageHandler | null } = { current: null };
  const capturedRequestHandler: { current: PageHandler | null } = { current: null };
  const mockPage = {
    on: jest.fn((event: unknown, handler: PageHandler) => {
      if (event === 'response') {
        capturedResponseHandler.current = handler;
      }
      if (event === 'request') {
        capturedRequestHandler.current = handler;
      }
    }),
  };

  return {
    getPage: (): { on: jest.Mock } => mockPage,

    getTestInfo: ({ status }: { status: 'passed' | 'failed' }): never =>
      ({
        status,
        expectedStatus: 'passed',
        attach: async (...args: unknown[]): Promise<void> => {
          attachCalls.push(args);
          return Promise.resolve();
        },
      }) as never,

    getAttachCalls: (): readonly unknown[][] => attachCalls,

    fireResponse: (args: OnResponseArgs): void => {
      const handler = capturedResponseHandler.current;
      if (!handler) {
        throw new Error('No response handler registered on page');
      }
      // Simulate Playwright Response shape that the page-events layer reads
      const mockRequest = {
        url: () => args.url,
        method: () => args.method,
      };
      const mockResponse = {
        request: () => mockRequest,
        status: () => args.status,
        headers: () => ({
          'content-type': args.hasCapturableBody ? 'application/json' : 'image/png',
        }),
        text: args.text,
      };
      handler(mockResponse);
    },

    getStderrWrites: (): readonly unknown[] => stderrChild.getWrites(),

    fireRequest: (args: OnRequestArgs): void => {
      const handler = capturedRequestHandler.current;
      if (!handler) {
        throw new Error('No request handler registered on page');
      }
      const mockRequest = {
        url: () => args.url,
        method: () => args.method,
        postData: () => args.postData,
      };
      handler(mockRequest);
    },
  };
};
