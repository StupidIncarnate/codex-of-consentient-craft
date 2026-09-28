/**
 * PURPOSE: Proxy for quest-delete-broker providing test control over HTTP responses. Composes the
 * gateway's own `fetchJsonProxy`, which registers an MSW handler rather than spying on
 * `globalThis.fetch` directly, so this coexists in a shared test file with sibling proxies still
 * staged through `StartEndpointMock` directly.
 *
 * USAGE:
 * const proxy = questDeleteBrokerProxy();
 * proxy.setupDelete();
 * await questDeleteBroker({ questId, guildId });
 */

import { fetchJsonProxy } from '#gateway/browser/fetch/fetch-json/fetch-json.proxy';

import { webConfigStatics } from '../../../statics/web-config/web-config-statics';

export const questDeleteBrokerProxy = (): {
  setupDelete: () => void;
  setupError: () => void;
} => {
  const jsonFetchProxy = fetchJsonProxy();

  return {
    // MSW matches this handler on method + PATH only, ignoring any query string — so this proves
    // the broker issues a DELETE against `/api/quests/:questId`, not that `guildId` lands in the
    // query correctly. `EndpointControl` (the testing package's own public surface) exposes no
    // request-URL read-back, only parsed bodies (of no use here — a DELETE carries none), so that
    // narrower claim cannot be proven through the gateway/testing surface as it stands. See
    // DECISIONS in this group's report.
    setupDelete: (): void => {
      jsonFetchProxy.setupSuccess({
        method: 'delete',
        url: webConfigStatics.api.routes.questById,
        body: { deleted: true },
      });
    },
    setupError: (): void => {
      jsonFetchProxy.setupConnectionRefused({
        method: 'delete',
        url: webConfigStatics.api.routes.questById,
      });
    },
  };
};
