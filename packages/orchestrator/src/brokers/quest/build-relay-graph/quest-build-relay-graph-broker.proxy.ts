/**
 * PURPOSE: Proxy for questBuildRelayGraphBroker — the broker is pure except for
 * crypto.randomUUID (operation + work item ids), which is pinned with a queue of fixed ids.
 *
 * USAGE:
 * const proxy = questBuildRelayGraphBrokerProxy();
 * proxy.setupUuids({ ids: ['00000000-0000-4000-8000-000000000001'] });
 * // ...call questBuildRelayGraphBroker...
 */

import { registerSpyOn } from '@dungeonmaster/testing/register-mock';

export const questBuildRelayGraphBrokerProxy = (): {
  setupUuids: (params: {
    ids: readonly `${string}-${string}-${string}-${string}-${string}`[];
  }) => void;
} => {
  const uuidSpy = registerSpyOn({ object: crypto, method: 'randomUUID', passthrough: true });

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
