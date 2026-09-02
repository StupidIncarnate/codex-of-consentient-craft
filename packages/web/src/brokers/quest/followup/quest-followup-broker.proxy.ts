// PURPOSE: Proxy for quest-followup-broker providing test control over HTTP responses plus
// USAGE: Create proxy in test, use setup methods to configure endpoint behavior, then
// getRequestBody() to assert the posted body.

import { RequestCountStub } from '@dungeonmaster/testing';
import type { RequestCount } from '@dungeonmaster/testing';

import { xhrPostWithProgressAdapterProxy } from '../../../adapters/xhr/post-with-progress/xhr-post-with-progress-adapter.proxy';
import { webConfigStatics } from '../../../statics/web-config/web-config-statics';

const BAD_REQUEST_STATUS = 400;

export const questFollowupBrokerProxy = (): {
  setupFollowup: (params: { chatProcessId: string }) => void;
  setupFollowupWithoutChatProcessId: () => void;
  setupRejected: (params: { error: string }) => void;
  setupRejectedNoBody: () => void;
  setupError: () => void;
  getRequestBody: () => unknown;
  getRequestUrl: () => unknown;
  getRequestCount: () => RequestCount;
} => {
  const xhrProxy = xhrPostWithProgressAdapterProxy({
    route: webConfigStatics.api.routes.questFollowup,
  });

  return {
    setupFollowup: ({ chatProcessId }): void => {
      xhrProxy.respondsWith({ status: 200, body: { chatProcessId } });
    },
    setupFollowupWithoutChatProcessId: (): void => {
      xhrProxy.respondsWith({ status: 200, body: {} });
    },
    setupRejected: ({ error }): void => {
      xhrProxy.respondsWith({ status: BAD_REQUEST_STATUS, body: { error } });
    },
    setupRejectedNoBody: (): void => {
      xhrProxy.respondsWith({ status: BAD_REQUEST_STATUS, body: {} });
    },
    setupError: (): void => {
      xhrProxy.networkError();
    },
    getRequestBody: (): unknown => xhrProxy.getSentBody(),
    getRequestUrl: (): unknown => xhrProxy.getSentUrl(),
    // The XHR proxy's own count is an unbranded internal tally — this broker's callers assert on
    // the branded RequestCount the rest of the codebase's endpoint mocks hand back.
    getRequestCount: (): RequestCount =>
      RequestCountStub({ value: Number(xhrProxy.getRequestCount()) }),
  };
};
