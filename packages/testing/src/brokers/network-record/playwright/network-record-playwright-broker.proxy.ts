/**
 * PURPOSE: Proxy for network-record-playwright-broker that captures page event handlers for testing
 *
 * USAGE:
 * const proxy = networkRecordPlaywrightBrokerProxy();
 * const recorder = networkRecordPlaywrightBroker({ page: proxy.getPage() });
 * proxy.fireResponse({ ... });
 */

import type { playwrightPageEventsAdapter } from '../../../adapters/playwright/page-events/playwright-page-events-adapter';

import { playwrightPageEventsAdapterProxy } from '../../../adapters/playwright/page-events/playwright-page-events-adapter.proxy';
import { playwrightTestInfoAttachAdapterProxy } from '../../../adapters/playwright/test-info-attach/playwright-test-info-attach-adapter.proxy';
import { registerSpyOn } from '../../../register-mock';

type AdapterParams = Parameters<typeof playwrightPageEventsAdapter>[0];
type OnResponseArgs = Parameters<AdapterParams['onResponse']>[0];
type OnRequestArgs = Parameters<AdapterParams['onRequest']>[0];
type PageHandler = (...args: readonly unknown[]) => void;

export const networkRecordPlaywrightBrokerProxy = (): {
  getPage: () => { on: jest.Mock };
  fireResponse: (args: OnResponseArgs) => void;
  fireRequest: (args: OnRequestArgs) => void;
  setupStderrCapture: () => void;
  getStderrWrites: () => readonly unknown[];
} => {
  playwrightPageEventsAdapterProxy();
  playwrightTestInfoAttachAdapterProxy();

  const stderrSpy: { current: ReturnType<typeof registerSpyOn> | null } = { current: null };
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

    fireResponse: (args: OnResponseArgs): void => {
      const handler = capturedResponseHandler.current;
      if (!handler) {
        throw new Error('No response handler registered on page');
      }
      // Simulate Playwright Response shape that the adapter wraps
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

    setupStderrCapture: (): void => {
      const handle = registerSpyOn({ object: process.stderr, method: 'write' });
      handle.mockImplementation(() => true);
      stderrSpy.current = handle;
    },

    getStderrWrites: (): readonly unknown[] =>
      stderrSpy.current?.mock.calls.map((call: readonly unknown[]) => call[0]) ?? [],

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
