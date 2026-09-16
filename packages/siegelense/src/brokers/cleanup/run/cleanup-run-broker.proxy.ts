import { registryReadBrokerProxy } from '../../registry/read/registry-read-broker.proxy';
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
} => {
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
  };
};
