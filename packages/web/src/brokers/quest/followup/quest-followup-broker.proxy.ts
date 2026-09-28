// PURPOSE: Proxy for quest-followup-broker providing test control over XHR responses plus
// inspection of the exact posted body. Composes the gateway's own xhrPostWithProgressProxy.
// USAGE: Create proxy in test, use setup methods to configure endpoint behavior, then
// getRequestBody() to assert the posted body. Pass `url` to stage one concrete request url instead
// of the route template, so a test proves the questId was substituted into it.

import type { RequestCount } from '@dungeonmaster/testing';

import { xhrPostWithProgressProxy } from '#gateway/browser/XMLHttpRequest/xhr-post-with-progress/xhr-post-with-progress.proxy';

import { webConfigStatics } from '../../../statics/web-config/web-config-statics';

const OK_STATUS = 200;
const BAD_REQUEST_STATUS = 400;

export const questFollowupBrokerProxy = ({
  url = webConfigStatics.api.routes.questFollowup,
}: { url?: string } = {}): {
  setupFollowup: (params: { chatProcessId: string }) => void;
  setupFollowupWithoutChatProcessId: () => void;
  setupRejected: (params: { error: string }) => void;
  setupRejectedNoBody: () => void;
  setupError: () => void;
  getRequestBody: () => Promise<unknown>;
  getRequestCount: () => RequestCount;
} => {
  const xhrProxy = xhrPostWithProgressProxy();

  return {
    setupFollowup: ({ chatProcessId }): void => {
      xhrProxy.setupResponse({
        url,
        status: OK_STATUS,
        bodyText: JSON.stringify({ chatProcessId }),
      });
    },
    setupFollowupWithoutChatProcessId: (): void => {
      xhrProxy.setupResponse({ url, status: OK_STATUS, bodyText: '{}' });
    },
    setupRejected: ({ error }): void => {
      xhrProxy.setupResponse({
        url,
        status: BAD_REQUEST_STATUS,
        bodyText: JSON.stringify({ error }),
      });
    },
    setupRejectedNoBody: (): void => {
      xhrProxy.setupResponse({ url, status: BAD_REQUEST_STATUS, bodyText: '{}' });
    },
    setupError: (): void => {
      xhrProxy.setupRefused({ url });
    },
    getRequestBody: async (): Promise<unknown> => {
      const bodies = await xhrProxy.getRequestBodies({ url });
      return bodies.at(-1);
    },
    getRequestCount: (): RequestCount => xhrProxy.getRequestCount({ url }),
  };
};
