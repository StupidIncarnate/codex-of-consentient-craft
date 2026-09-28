// PURPOSE: Proxy for guild-detail-broker providing test control over HTTP responses
// USAGE: Create proxy in test, use setup methods to configure endpoint behavior

import type { Guild } from '@dungeonmaster/shared/contracts';

import { fetchJsonProxy } from '#gateway/browser/fetch/fetch-json/fetch-json.proxy';

import { webConfigStatics } from '../../../statics/web-config/web-config-statics';

export const guildDetailBrokerProxy = (): {
  setupGuild: (params: { guild: Guild }) => void;
  setupError: () => void;
} => {
  const jsonFetchProxy = fetchJsonProxy();
  const address = { method: 'get', url: webConfigStatics.api.routes.guildById } as const;

  return {
    setupGuild: ({ guild }: { guild: Guild }): void => {
      jsonFetchProxy.setupSuccess({ ...address, body: guild });
    },
    setupError: (): void => {
      jsonFetchProxy.setupConnectionRefused(address);
    },
  };
};
