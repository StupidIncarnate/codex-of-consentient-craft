/**
 * PURPOSE: Proxy for mintNextFamilyLayerBroker — the walk is pure except for randomUUID,
 * which stamps each minted scope's id and is pinned here with a queue of fixed ids so a test can
 * assert the whole OperationItem rather than every field but one.
 *
 * USAGE:
 * const proxy = mintNextFamilyLayerBrokerProxy();
 * proxy.setupUuids({ ids: ['00000000-0000-4000-8000-000000000001'] });
 */

import type { MockHandle } from '@dungeonmaster/testing/register-mock';
import { randomUUID } from '#gateway/node/crypto';
import { registerMock, requireActual } from '@dungeonmaster/testing/register-mock';

export const mintNextFamilyLayerBrokerProxy = (): {
  setupUuids: (params: {
    ids: readonly `${string}-${string}-${string}-${string}-${string}`[];
  }) => void;
} => {
  const uuidSpy: MockHandle = registerMock({ fn: randomUUID });
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
        // randomUUID takes no arguments, so [] is the only possible address. Successive
        // calls within one mint need different results, which is what onceFor is for.
        uuidSpy.onceFor([]).returns(id);
      }
    },
  };
};
