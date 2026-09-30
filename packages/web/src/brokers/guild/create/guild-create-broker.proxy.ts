/**
 * PURPOSE: Proxy for guild-create-broker providing test control over HTTP responses. Composes
 * the gateway's own `fetchJsonProxy`, which registers an MSW handler rather than spying on
 * `globalThis.fetch` directly.
 *
 * USAGE:
 * const proxy = guildCreateBrokerProxy();
 * proxy.setupCreate({ id });
 * await guildCreateBroker({ name: 'My Guild', path: '/home/user/my-guild' });
 */

import type { Guild } from '@dungeonmaster/shared/contracts';

import { fetchJsonProxy } from '#gateway/browser/fetch/fetch-json/fetch-json.proxy';

import { webConfigStatics } from '../../../statics/web-config/web-config-statics';

export const guildCreateBrokerProxy = (): {
  setupCreate: (params: { id: Guild['id'] }) => void;
  setupError: () => void;
  setupInvalidResponse: (params: { data: unknown }) => void;
} => {
  const jsonFetchProxy = fetchJsonProxy();

  return {
    setupCreate: ({ id }: { id: Guild['id'] }): void => {
      jsonFetchProxy.setupSuccess({
        method: 'post',
        url: webConfigStatics.api.routes.guilds,
        body: { id },
      });
    },
    setupError: (): void => {
      jsonFetchProxy.setupConnectionRefused({
        method: 'post',
        url: webConfigStatics.api.routes.guilds,
      });
    },
    setupInvalidResponse: ({ data }: { data: unknown }): void => {
      jsonFetchProxy.setupSuccess({
        method: 'post',
        url: webConfigStatics.api.routes.guilds,
        body: data,
      });
    },
  };
};
