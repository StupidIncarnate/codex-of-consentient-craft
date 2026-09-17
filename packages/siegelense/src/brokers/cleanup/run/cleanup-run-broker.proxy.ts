import { registryReadBrokerProxy } from '../../registry/read/registry-read-broker.proxy';
import { assetsAgeLayerBrokerProxy } from './assets-age-layer-broker.proxy';
import { lockReleaseLayerBrokerProxy } from './lock-release-layer-broker.proxy';
import { staleReapLayerBrokerProxy } from './stale-reap-layer-broker.proxy';

export const cleanupRunBrokerProxy = (): {
  setupRegistry: ReturnType<typeof staleReapLayerBrokerProxy>['setupRegistry'];
  setupDriverUnreachable: ReturnType<typeof staleReapLayerBrokerProxy>['setupDriverUnreachable'];
  setupDriverUnreachableNoHeartbeat: ReturnType<
    typeof staleReapLayerBrokerProxy
  >['setupDriverUnreachableNoHeartbeat'];
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

  return {
    setupRegistry: reapProxy.setupRegistry,
    setupDriverUnreachable: reapProxy.setupDriverUnreachable,
    setupDriverUnreachableNoHeartbeat: reapProxy.setupDriverUnreachableNoHeartbeat,
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
