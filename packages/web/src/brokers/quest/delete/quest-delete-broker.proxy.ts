// PURPOSE: Proxy for quest-delete-broker providing test control over HTTP responses
// USAGE: Create proxy in test, use setup methods to configure endpoint behavior

import { StartEndpointMock } from '@dungeonmaster/testing';
import { registerSpyOn } from '@dungeonmaster/testing/register-mock';

import { fetchDeleteAdapterProxy } from '../../../adapters/fetch/delete/fetch-delete-adapter.proxy';
import { webConfigStatics } from '../../../statics/web-config/web-config-statics';

export const questDeleteBrokerProxy = (): {
  setupDelete: () => void;
  setupError: () => void;
  getRequestUrl: () => unknown;
  getRequestMethod: () => unknown;
} => {
  fetchDeleteAdapterProxy();

  const fetchSpy = registerSpyOn({ object: globalThis, method: 'fetch', passthrough: true });

  const endpoint = StartEndpointMock.listen({
    method: 'delete',
    url: webConfigStatics.api.routes.questById,
  });

  return {
    setupDelete: (): void => {
      endpoint.resolves({ data: { deleted: true } });
    },
    setupError: (): void => {
      endpoint.networkError();
    },
    getRequestUrl: (): unknown => {
      const lastCall = fetchSpy.mock.calls.at(-1);
      if (!lastCall) {
        return null;
      }
      const [input] = lastCall;
      return typeof input === 'string' ? input : String(input);
    },
    getRequestMethod: (): unknown => {
      const lastCall = fetchSpy.mock.calls.at(-1);
      if (!lastCall) {
        return null;
      }
      const init = lastCall[1] as RequestInit | undefined;
      return init?.method ?? null;
    },
  };
};
