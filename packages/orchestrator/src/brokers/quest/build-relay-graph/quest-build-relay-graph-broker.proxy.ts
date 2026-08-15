/**
 * PURPOSE: Proxy for questBuildRelayGraphBroker — the broker is pure except for
 * crypto.randomUUID (operation + work item ids), which is pinned with a queue of fixed ids. Also
 * exposes statics overrides that empty the feature registry entry's TWO seed sources —
 * `relayTail` and `startImplementationOps` — because the defensive "no actionable operation"
 * branch needs BOTH empty to be reachable: every real quest type seeds at least one pending
 * implementation item even when its tail is gone.
 *
 * USAGE:
 * const proxy = questBuildRelayGraphBrokerProxy();
 * proxy.setupUuids({ ids: ['00000000-0000-4000-8000-000000000001'] });
 * // ...call questBuildRelayGraphBroker...
 * proxy.setupEmptyFeatureRelayTail(); // then restoreFeatureRelayTail() inline in the test
 * proxy.setupEmptyFeatureStartImplementationOps(); // then restoreFeatureStartImplementationOps()
 */

import { questTypeRegistryStatics } from '@dungeonmaster/shared/statics';
import { registerSpyOn } from '@dungeonmaster/testing/register-mock';

export const questBuildRelayGraphBrokerProxy = (): {
  setupUuids: (params: {
    ids: readonly `${string}-${string}-${string}-${string}-${string}`[];
  }) => void;
  setupEmptyFeatureRelayTail: () => void;
  restoreFeatureRelayTail: () => void;
  setupEmptyFeatureStartImplementationOps: () => void;
  restoreFeatureStartImplementationOps: () => void;
} => {
  const uuidSpy = registerSpyOn({ object: crypto, method: 'randomUUID', passthrough: true });
  const originalRelayTail = questTypeRegistryStatics.feature.relayTail;
  const originalStartImplementationOps = questTypeRegistryStatics.feature.startImplementationOps;

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

    setupEmptyFeatureRelayTail: (): void => {
      Object.assign(questTypeRegistryStatics.feature, { relayTail: [] });
    },

    restoreFeatureRelayTail: (): void => {
      Object.assign(questTypeRegistryStatics.feature, { relayTail: originalRelayTail });
    },

    setupEmptyFeatureStartImplementationOps: (): void => {
      Object.assign(questTypeRegistryStatics.feature, { startImplementationOps: [] });
    },

    restoreFeatureStartImplementationOps: (): void => {
      Object.assign(questTypeRegistryStatics.feature, {
        startImplementationOps: originalStartImplementationOps,
      });
    },
  };
};
