/**
 * PURPOSE: Proxy for quest-abandon-broker providing test control over HTTP responses. Composes
 * the gateway's own `fetchJsonProxy`, which registers an MSW handler rather than spying on
 * `globalThis.fetch` directly.
 *
 * USAGE:
 * const proxy = questAbandonBrokerProxy();
 * proxy.setupAbandon();
 * await questAbandonBroker({ questId });
 */

import { fetchJsonProxy } from '#gateway/browser/fetch/fetch-json/fetch-json.proxy';

import { webConfigStatics } from '../../../statics/web-config/web-config-statics';

export const questAbandonBrokerProxy = (): {
  setupAbandon: () => void;
  setupError: () => void;
  getRequestBodies: () => Promise<unknown[]>;
} => {
  const jsonFetchProxy = fetchJsonProxy();

  return {
    setupAbandon: (): void => {
      jsonFetchProxy.setupSuccess({
        method: 'post',
        url: webConfigStatics.api.routes.questAbandon,
        body: { abandoned: true },
      });
    },
    setupError: (): void => {
      jsonFetchProxy.setupConnectionRefused({
        method: 'post',
        url: webConfigStatics.api.routes.questAbandon,
      });
    },
    // What each received request actually carried, so a test can prove the POST is bodyless rather
    // than only that it happened. A bodyless request has no JSON to parse and is recorded as its
    // parse error; a `{}` on the wire records as `{}`, which is what this distinguishes.
    getRequestBodies: async (): Promise<unknown[]> =>
      jsonFetchProxy.getRequestBodies({
        method: 'post',
        url: webConfigStatics.api.routes.questAbandon,
      }),
  };
};
