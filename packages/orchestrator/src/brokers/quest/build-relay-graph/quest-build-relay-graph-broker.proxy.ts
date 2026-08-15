/**
 * PURPOSE: Proxy for questBuildRelayGraphBroker — the broker is pure except for
 * crypto.randomUUID (operation + work item ids), which is pinned with a queue of fixed ids, and
 * gitHeadShaAdapter (the baseRef stamp), which defaults to "HEAD unreadable" so parent proxies
 * that don't care about baseRef (quest-hydrate-broker, orchestration-start-responder) keep working
 * without describing this call themselves. Also exposes statics overrides that empty the feature
 * registry entry's TWO seed sources — `relayTail` and `startImplementationOps` — because the
 * defensive "no actionable operation" branch needs BOTH empty to be reachable: every real quest
 * type seeds at least one pending implementation item even when its tail is gone.
 *
 * USAGE:
 * const proxy = questBuildRelayGraphBrokerProxy();
 * proxy.setupUuids({ ids: ['00000000-0000-4000-8000-000000000001'] });
 * proxy.setupHeadSha({ sha: 'a1a1a1a1a1a1a1a1a1a1a1a1a1a1a1a1a1a1a1a1' }); // opt in to the stamp
 * // ...call questBuildRelayGraphBroker...
 * proxy.setupEmptyFeatureRelayTail(); // then restoreFeatureRelayTail() inline in the test
 * proxy.setupEmptyFeatureStartImplementationOps(); // then restoreFeatureStartImplementationOps()
 */

import { processCwdAdapterProxy } from '@dungeonmaster/shared/testing';
import { questTypeRegistryStatics } from '@dungeonmaster/shared/statics';
import { registerSpyOn } from '@dungeonmaster/testing/register-mock';

import { gitHeadShaAdapterProxy } from '../../../adapters/git/head-sha/git-head-sha-adapter.proxy';

export const questBuildRelayGraphBrokerProxy = (): {
  setupUuids: (params: {
    ids: readonly `${string}-${string}-${string}-${string}-${string}`[];
  }) => void;
  setupEmptyFeatureRelayTail: () => void;
  restoreFeatureRelayTail: () => void;
  setupEmptyFeatureStartImplementationOps: () => void;
  restoreFeatureStartImplementationOps: () => void;
  setupHeadSha: (params: { sha: string }) => void;
  setupHeadShaUnavailable: () => void;
} => {
  const uuidSpy = registerSpyOn({ object: crypto, method: 'randomUUID', passthrough: true });
  const originalRelayTail = questTypeRegistryStatics.feature.relayTail;
  const originalStartImplementationOps = questTypeRegistryStatics.feature.startImplementationOps;
  // cwd's actual value is inert here — gitHeadShaAdapterProxy's mocked spawn matches on the `git`
  // command alone, not on cwd — but processCwdAdapter shares one global mock across every proxy
  // that composes it, so this broker's own call still needs a deterministic default.
  processCwdAdapterProxy();
  const headShaProxy = gitHeadShaAdapterProxy();
  // Default: HEAD unreadable. This broker only calls gitHeadShaAdapter when quest.baseRef is
  // unset, so most tests (and every caller that composes this proxy without describing a call of
  // its own) never need to think about it — baseRef simply stays undefined, matching the
  // pre-existing return shape.
  headShaProxy.setupFailure();

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

    setupHeadSha: ({ sha }: { sha: string }): void => {
      headShaProxy.setupSuccess({ sha });
    },

    setupHeadShaUnavailable: (): void => {
      headShaProxy.setupFailure();
    },
  };
};
