// PURPOSE: Proxy for quest-new-broker providing test control over HTTP responses over the XHR
// upload-progress transport. Composes the gateway's own xhrPostWithProgressProxy.
// USAGE: Create proxy in test, use setup methods to configure endpoint behavior, then
// getRequestBodies() to assert what was posted. Pass `url` to stage one concrete request url
// instead of the route template, so a test proves the guildId was substituted into it.

import type { ProcessId, QuestId } from '@dungeonmaster/shared/contracts';

import { xhrPostWithProgressProxy } from '#gateway/browser/XMLHttpRequest/xhr-post-with-progress/xhr-post-with-progress.proxy';

import { webConfigStatics } from '../../../statics/web-config/web-config-statics';

const OK_STATUS = 200;

export const questNewBrokerProxy = ({
  url = webConfigStatics.api.routes.questNew,
}: { url?: string } = {}): {
  setupNew: (params: { questId: QuestId; chatProcessId: ProcessId }) => void;
  setupInvalidResponse: (params: { questId: unknown; chatProcessId: unknown }) => void;
  setupRejected: (params: { status: number; error: string }) => void;
  setupError: () => void;
  getRequestCount: () => number;
  getRequestBodies: () => Promise<unknown[]>;
} => {
  const xhrProxy = xhrPostWithProgressProxy();

  return {
    setupNew: ({ questId, chatProcessId }): void => {
      xhrProxy.setupResponse({
        url,
        status: OK_STATUS,
        bodyText: JSON.stringify({ questId, chatProcessId }),
      });
    },
    setupInvalidResponse: ({ questId, chatProcessId }): void => {
      xhrProxy.setupResponse({
        url,
        status: OK_STATUS,
        bodyText: JSON.stringify({ questId, chatProcessId }),
      });
    },
    setupRejected: ({ status, error }): void => {
      xhrProxy.setupResponse({ url, status, bodyText: JSON.stringify({ error }) });
    },
    setupError: (): void => {
      xhrProxy.setupRefused({ url });
    },
    getRequestCount: (): number => xhrProxy.getRequestCount({ url }),
    // The POSTed bodies, so a test can prove images/questType reached the wire rather than only
    // that a request happened. Callers assert the LAST entry via .at(-1).
    getRequestBodies: async (): Promise<unknown[]> => xhrProxy.getRequestBodies({ url }),
  };
};
