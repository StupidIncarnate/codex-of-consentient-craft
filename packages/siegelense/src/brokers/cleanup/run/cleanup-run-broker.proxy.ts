import { nowProxy } from '#gateway/node/Date/now/now.proxy';

import { registryReadBrokerProxy } from '../../registry/read/registry-read-broker.proxy';
import { assetsAgeLayerBrokerProxy } from './assets-age-layer-broker.proxy';
import { lockReleaseLayerBrokerProxy } from './lock-release-layer-broker.proxy';
import { staleReapLayerBrokerProxy } from './stale-reap-layer-broker.proxy';

// The clock every cleanup test reads its own NOW_MS off; staged at construction and again with
// every shutdown-reason write, because that write's proxy re-stages Date.now itself.
const CLEANUP_NOW_MS = 1_700_000_000_000;

export const cleanupRunBrokerProxy = (): {
  setupRegistry: ReturnType<typeof staleReapLayerBrokerProxy>['setupRegistry'];
  setupDriverUnreachableReapsLivePgids: ReturnType<
    typeof staleReapLayerBrokerProxy
  >['setupDriverUnreachableReapsLivePgids'];
  setupDriverUnreachableNoPgids: ReturnType<
    typeof staleReapLayerBrokerProxy
  >['setupDriverUnreachableNoPgids'];
  setupShutdownReasonWriteSucceeds: ReturnType<
    typeof staleReapLayerBrokerProxy
  >['setupShutdownReasonWriteSucceeds'];
  setupNoLocks: ReturnType<typeof lockReleaseLayerBrokerProxy>['setupNoLocks'];
  setupBootLockStale: ReturnType<typeof lockReleaseLayerBrokerProxy>['setupBootLockStale'];
  getReleasedRegistry: ReturnType<typeof staleReapLayerBrokerProxy>['getReleasedRegistry'];
  setupEvidenceTree: ReturnType<typeof assetsAgeLayerBrokerProxy>['setupEvidenceTree'];
  setupDir: ReturnType<typeof assetsAgeLayerBrokerProxy>['setupDir'];
  setupFile: ReturnType<typeof assetsAgeLayerBrokerProxy>['setupFile'];
  setupDeleteSucceeds: ReturnType<typeof assetsAgeLayerBrokerProxy>['setupDeleteSucceeds'];
  getDeletedPaths: ReturnType<typeof assetsAgeLayerBrokerProxy>['getDeletedPaths'];
} => {
  // The age proxy is constructed FIRST, and the order is load-bearing. Its chain reaches
  // `pathJoinAdapterProxy` and `osHomedirAdapterProxy`, and constructing either re-stamps that
  // mock's sticky default — which, built after the lock and reap chains, makes `boot.lock` resolve
  // through the real join off the default home instead of the path `setupNoLocks` staged. Measured:
  // six cleanup tests failed with `Failed to read file at /home/default/.dungeonmaster/siegelense/
  // boot.lock` with this line last, and all six pass with it first.
  const ageProxy = assetsAgeLayerBrokerProxy();
  registryReadBrokerProxy();
  const lockProxy = lockReleaseLayerBrokerProxy();
  const reapProxy = staleReapLayerBrokerProxy();
  const clockProxy = nowProxy();
  clockProxy.setupNow({ ms: CLEANUP_NOW_MS });

  return {
    // The registry proxy underneath stages its own clock, so the cleanup clock is restored after it.
    setupRegistry: (...args: Parameters<ReturnType<typeof staleReapLayerBrokerProxy>['setupRegistry']>): void => {
      reapProxy.setupRegistry(...args);
      clockProxy.setupNow({ ms: CLEANUP_NOW_MS });
    },
    setupDriverUnreachableReapsLivePgids: reapProxy.setupDriverUnreachableReapsLivePgids,
    setupDriverUnreachableNoPgids: reapProxy.setupDriverUnreachableNoPgids,
    setupShutdownReasonWriteSucceeds: ({ evidencePath }: { evidencePath: string }): void => {
      reapProxy.setupShutdownReasonWriteSucceeds({ evidencePath, nowMs: CLEANUP_NOW_MS });
    },
    setupNoLocks: lockProxy.setupNoLocks,
    setupBootLockStale: lockProxy.setupBootLockStale,
    getReleasedRegistry: reapProxy.getReleasedRegistry,
    setupEvidenceTree: ageProxy.setupEvidenceTree,
    setupDir: ageProxy.setupDir,
    setupFile: ageProxy.setupFile,
    setupDeleteSucceeds: ageProxy.setupDeleteSucceeds,
    getDeletedPaths: ageProxy.getDeletedPaths,
  };
};
