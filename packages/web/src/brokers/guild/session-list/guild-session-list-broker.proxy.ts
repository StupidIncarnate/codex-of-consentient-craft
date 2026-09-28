// PURPOSE: Proxy for guild-session-list-broker providing test control over HTTP responses
// USAGE: Create proxy in test, use setup methods to configure endpoint behavior

import { fetchJsonProxy } from '#gateway/browser/fetch/fetch-json/fetch-json.proxy';

import { webConfigStatics } from '../../../statics/web-config/web-config-statics';

export const guildSessionListBrokerProxy = (): {
  setupSessions: (params: { sessions: unknown[] }) => void;
  setupError: () => void;
} => {
  const jsonFetchProxy = fetchJsonProxy();
  const address = { method: 'get', url: webConfigStatics.api.routes.guildSessions } as const;

  return {
    setupSessions: ({ sessions }: { sessions: unknown[] }): void => {
      jsonFetchProxy.setupSuccess({ ...address, body: sessions });
    },
    setupError: (): void => {
      jsonFetchProxy.setupConnectionRefused(address);
    },
  };
};
