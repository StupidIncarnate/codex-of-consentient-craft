// PURPOSE: Proxy for quest-chat-broker providing test control over XHR responses, including
// non-2xx rejections and inspection of the exact posted body/URL — msw/node does not intercept
// XMLHttpRequest, so this composes xhrPostWithProgressAdapterProxy rather than StartEndpointMock.
// USAGE: Create proxy in test, use setup methods to configure the XHR response, then
// getRequestBody()/getRequestUrl() to assert what was actually posted.

import type { ProcessId } from '@dungeonmaster/shared/contracts';
import { RequestCountStub } from '@dungeonmaster/testing';
import type { RequestCount } from '@dungeonmaster/testing';

import { xhrPostWithProgressAdapterProxy } from '../../../adapters/xhr/post-with-progress/xhr-post-with-progress-adapter.proxy';
import { webConfigStatics } from '../../../statics/web-config/web-config-statics';

const OK_STATUS = 200;

export const questChatBrokerProxy = (): {
  setupChat: (params: { chatProcessId: ProcessId }) => void;
  setupInvalidResponse: (params: { chatProcessId: unknown }) => void;
  setupError: () => void;
  setupRejected: (params: { status: number; error: string }) => void;
  getRequestCount: () => RequestCount;
  getRequestBody: () => unknown;
  getRequestUrl: () => unknown;
} => {
  const xhrProxy = xhrPostWithProgressAdapterProxy({
    route: webConfigStatics.api.routes.questChat,
  });

  return {
    setupChat: ({ chatProcessId }): void => {
      xhrProxy.respondsWith({ status: OK_STATUS, body: { chatProcessId } });
    },
    setupInvalidResponse: ({ chatProcessId }): void => {
      xhrProxy.respondsWith({ status: OK_STATUS, body: { chatProcessId } });
    },
    setupError: (): void => {
      xhrProxy.networkError();
    },
    setupRejected: ({ status, error }): void => {
      xhrProxy.respondsWith({ status, body: { error } });
    },
    // The XHR proxy's own count is an unbranded internal tally — this broker's callers assert on
    // the branded RequestCount the rest of the codebase's endpoint mocks hand back.
    getRequestCount: (): RequestCount =>
      RequestCountStub({ value: Number(xhrProxy.getRequestCount()) }),
    getRequestBody: (): unknown => xhrProxy.getSentBody(),
    getRequestUrl: (): unknown => xhrProxy.getSentUrl(),
  };
};
