// PURPOSE: Proxy for quest-followup-stop-broker providing test control over HTTP responses
// USAGE: Create proxy in test, use setup methods to configure endpoint behavior

import { fetchJsonProxy } from '#gateway/browser/fetch/fetch-json/fetch-json.proxy';

import { webConfigStatics } from '../../../statics/web-config/web-config-statics';

export const questFollowupStopBrokerProxy = (): {
  setupStopped: () => void;
  setupNothingRunning: () => void;
  setupError: () => void;
  getRequestCount: () => number;
  getRequestBodies: () => Promise<unknown[]>;
} => {
  const jsonFetchProxy = fetchJsonProxy();
  const address = { method: 'post', url: webConfigStatics.api.routes.questFollowupStop } as const;

  return {
    setupStopped: (): void => {
      jsonFetchProxy.setupSuccess({ ...address, body: { stopped: true } });
    },
    // The server's answer when the reader pressed STOP either side of a turn: a 200, not an error.
    setupNothingRunning: (): void => {
      jsonFetchProxy.setupSuccess({ ...address, body: { stopped: false } });
    },
    setupError: (): void => {
      jsonFetchProxy.setupConnectionRefused(address);
    },
    getRequestCount: (): number => jsonFetchProxy.getRequestCount(address),
    // What each received request actually carried, so a test can prove the POST is bodyless rather
    // than only that it happened. A bodyless request has no JSON to parse and is recorded as its
    // parse error; a `{}` on the wire records as `{}`, which is what this distinguishes.
    getRequestBodies: async (): Promise<unknown[]> => jsonFetchProxy.getRequestBodies(address),
  };
};
