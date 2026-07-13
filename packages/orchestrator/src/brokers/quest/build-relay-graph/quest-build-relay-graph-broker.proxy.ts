/**
 * PURPOSE: Proxy for questBuildRelayGraphBroker — the broker is pure except for
 * crypto.randomUUID (operation + work item ids), which is pinned with a queue of fixed ids.
 * Also exposes a statics override that empties the feature relay tail so the defensive
 * "no actionable operation" branch is reachable (both real quest types always append a
 * non-empty tail).
 *
 * USAGE:
 * const proxy = questBuildRelayGraphBrokerProxy();
 * proxy.setupUuids({ ids: ['00000000-0000-4000-8000-000000000001'] });
 * // ...call questBuildRelayGraphBroker...
 * proxy.setupEmptyFeatureRelayTail(); // then restoreFeatureRelayTail() inline in the test
 */

import { questTypeRegistryStatics } from '@dungeonmaster/shared/statics';
import { registerSpyOn } from '@dungeonmaster/testing/register-mock';

export const questBuildRelayGraphBrokerProxy = (): {
  setupUuids: (params: {
    ids: readonly `${string}-${string}-${string}-${string}-${string}`[];
  }) => void;
  setupEmptyFeatureRelayTail: () => void;
  restoreFeatureRelayTail: () => void;
} => {
  const uuidSpy = registerSpyOn({ object: crypto, method: 'randomUUID', passthrough: true });
  const originalRelayTail = questTypeRegistryStatics.feature.relayTail;

  return {
    setupUuids: ({
      ids,
    }: {
      ids: readonly `${string}-${string}-${string}-${string}-${string}`[];
    }): void => {
      for (const id of ids) {
        uuidSpy.mockReturnValueOnce(id);
      }
    },

    setupEmptyFeatureRelayTail: (): void => {
      Object.assign(questTypeRegistryStatics.feature, { relayTail: [] });
    },

    restoreFeatureRelayTail: (): void => {
      Object.assign(questTypeRegistryStatics.feature, { relayTail: originalRelayTail });
    },
  };
};
