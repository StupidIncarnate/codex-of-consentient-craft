/**
 * PURPOSE: Proxy for questBuildRelayGraphBroker — the broker is pure except for
 * randomUUID (operation + work item ids), which is pinned with a queue of fixed ids.
 *
 * USAGE:
 * const proxy = questBuildRelayGraphBrokerProxy();
 * proxy.setupUuids({ ids: ['00000000-0000-4000-8000-000000000001'] });
 * // ...call questBuildRelayGraphBroker...
 */

import { randomUUID } from '#gateway/node/crypto';
import { registerMock, requireActual } from '@dungeonmaster/testing/register-mock';

export const questBuildRelayGraphBrokerProxy = (): {
  setupUuids: (params: {
    ids: readonly `${string}-${string}-${string}-${string}-${string}`[];
  }) => void;
} => {
  const uuidSpy = registerMock({ fn: randomUUID });
  const realCrypto = requireActual<{ randomUUID: typeof randomUUID }>({
    module: '#gateway/node/crypto',
  });
  uuidSpy.calledWith([]).implement(() => realCrypto.randomUUID());

  return {
    setupUuids: ({
      ids,
    }: {
      ids: readonly `${string}-${string}-${string}-${string}-${string}`[];
    }): void => {
      for (const id of ids) {
        uuidSpy.onceFor([]).returns(id);
      }
    },
  };
};
