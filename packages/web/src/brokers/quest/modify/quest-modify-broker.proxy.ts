/**
 * PURPOSE: Proxy for quest-modify-broker providing test control over HTTP responses. Composes
 * the gateway's own `fetchJsonProxy`, which registers an MSW handler rather than spying on
 * `globalThis.fetch` directly.
 *
 * USAGE:
 * const proxy = questModifyBrokerProxy();
 * proxy.setupModify();
 * await questModifyBroker({ questId, modifications });
 */

import { fetchJsonProxy } from '#gateway/browser/fetch/fetch-json/fetch-json.proxy';

import { webConfigStatics } from '../../../statics/web-config/web-config-statics';

export const questModifyBrokerProxy = (): {
  setupModify: () => void;
  setupFailure: (params: { error: string }) => void;
  setupError: () => void;
  setupInvalidResponse: (params: { data: unknown }) => void;
} => {
  const jsonFetchProxy = fetchJsonProxy();
  const url = webConfigStatics.api.routes.questById;

  return {
    setupModify: (): void => {
      jsonFetchProxy.setupSuccess({ method: 'patch', url, body: { success: true } });
    },
    setupFailure: ({ error }: { error: string }): void => {
      jsonFetchProxy.setupSuccess({ method: 'patch', url, body: { success: false, error } });
    },
    setupError: (): void => {
      jsonFetchProxy.setupConnectionRefused({ method: 'patch', url });
    },
    setupInvalidResponse: ({ data }: { data: unknown }): void => {
      jsonFetchProxy.setupSuccess({ method: 'patch', url, body: data });
    },
  };
};
