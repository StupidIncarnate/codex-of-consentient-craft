// PURPOSE: Proxy for quest-chat-broker providing test control over XHR responses, including
// non-2xx rejections and inspection of the exact posted body. Composes the gateway's own
// xhrPostWithProgressProxy, which stages through MSW.
// USAGE: Create proxy in test, use setup methods to configure the XHR response, then
// getRequestBody() to assert what was actually posted. Pass `url` to stage one concrete request
// url instead of the route template, so a test proves the questId was substituted into it.

import type { ProcessId } from '@dungeonmaster/shared/contracts';
import type { RequestCount } from '@dungeonmaster/testing';

import { xhrPostWithProgressProxy } from '#gateway/browser/XMLHttpRequest/xhr-post-with-progress/xhr-post-with-progress.proxy';

import { webConfigStatics } from '../../../statics/web-config/web-config-statics';

const OK_STATUS = 200;

export const questChatBrokerProxy = ({
  url = webConfigStatics.api.routes.questChat,
}: { url?: string } = {}): {
  setupChat: (params: { chatProcessId: ProcessId }) => void;
  setupInvalidResponse: (params: { chatProcessId: unknown }) => void;
  setupError: () => void;
  setupRejected: (params: { status: number; error: string }) => void;
  getRequestCount: () => RequestCount;
  getRequestBody: () => Promise<unknown>;
} => {
  const xhrProxy = xhrPostWithProgressProxy();

  return {
    setupChat: ({ chatProcessId }): void => {
      xhrProxy.setupResponse({
        url,
        status: OK_STATUS,
        bodyText: JSON.stringify({ chatProcessId }),
      });
    },
    setupInvalidResponse: ({ chatProcessId }): void => {
      xhrProxy.setupResponse({
        url,
        status: OK_STATUS,
        bodyText: JSON.stringify({ chatProcessId }),
      });
    },
    setupError: (): void => {
      xhrProxy.setupRefused({ url });
    },
    setupRejected: ({ status, error }): void => {
      xhrProxy.setupResponse({ url, status, bodyText: JSON.stringify({ error }) });
    },
    getRequestCount: (): RequestCount => xhrProxy.getRequestCount({ url }),
    getRequestBody: async (): Promise<unknown> => {
      const bodies = await xhrProxy.getRequestBodies({ url });
      return bodies.at(-1);
    },
  };
};
