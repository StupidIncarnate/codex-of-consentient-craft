// PURPOSE: Proxy for quest-new-broker providing test control over HTTP responses over the XHR
// upload-progress transport.
// USAGE: Create proxy in test, use setup methods to configure endpoint behavior, then
// getRequestBodies() / getRequestUrl() to assert what was posted.

import type { ProcessId, QuestId } from '@dungeonmaster/shared/contracts';
import { RequestCountStub } from '@dungeonmaster/testing';
import type { RequestCount } from '@dungeonmaster/testing';

import { xhrPostWithProgressAdapterProxy } from '../../../adapters/xhr/post-with-progress/xhr-post-with-progress-adapter.proxy';
import { webConfigStatics } from '../../../statics/web-config/web-config-statics';

export const questNewBrokerProxy = (): {
  setupNew: (params: { questId: QuestId; chatProcessId: ProcessId }) => void;
  setupInvalidResponse: (params: { questId: unknown; chatProcessId: unknown }) => void;
  setupRejected: (params: { status: number; error: string }) => void;
  setupError: () => void;
  getRequestCount: () => RequestCount;
  getRequestBodies: () => Promise<unknown[]>;
  getRequestUrl: () => unknown;
} => {
  const xhrProxy = xhrPostWithProgressAdapterProxy({ route: webConfigStatics.api.routes.questNew });

  return {
    setupNew: ({ questId, chatProcessId }): void => {
      xhrProxy.respondsWith({ status: 200, body: { questId, chatProcessId } });
    },
    setupInvalidResponse: ({ questId, chatProcessId }): void => {
      xhrProxy.respondsWith({ status: 200, body: { questId, chatProcessId } });
    },
    setupRejected: ({ status, error }): void => {
      xhrProxy.respondsWith({ status, body: { error } });
    },
    setupError: (): void => {
      xhrProxy.networkError();
    },
    // The XHR proxy's own count is an unbranded internal tally — this broker's callers assert on
    // the branded RequestCount the rest of the codebase's endpoint mocks hand back.
    getRequestCount: (): RequestCount =>
      RequestCountStub({ value: Number(xhrProxy.getRequestCount()) }),
    // The POSTed bodies, so a test can prove images/questType reached the wire rather than only
    // that a request happened. Callers assert the LAST entry via .at(-1).
    getRequestBodies: async (): Promise<unknown[]> => Promise.resolve(xhrProxy.getSentBodies()),
    getRequestUrl: (): unknown => xhrProxy.getSentUrl(),
  };
};
