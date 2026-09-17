/**
 * PURPOSE: Test proxy for snapshotListBroker — stages the registry row the instance state is read
 * from, and the snapshot index the answer's rows come from. `homePathFor` hand-concatenates the
 * throwaway home the same way `locationsInstanceHomePathFindBroker` builds it (the `osTmpdirAdapter`
 * proxy's own sticky `/tmp` default plus the driver's home prefix), rather than calling that resolver
 * at test-setup time: its `pathJoinAdapter` mock is shared with the registry resolver, which stages
 * ONE-SHOT returns, and a real join during setup would consume one queued for the registry's own
 * later call.
 *
 * USAGE:
 * const proxy = snapshotListBrokerProxy();
 * proxy.setupInstance({ entry });
 * proxy.setupIndex({ instanceId, records });
 */

import { AbsoluteFilePathStub } from '@dungeonmaster/shared/contracts';
import type { AbsoluteFilePath } from '@dungeonmaster/shared/contracts';

import { RegistryStub } from '../../../contracts/registry/registry.stub';
import type { InstanceId } from '../../../contracts/instance-id/instance-id-contract';
import type { RegistryEntryStub } from '../../../contracts/registry-entry/registry-entry.stub';
import type { SnapshotRecordStub } from '../../../contracts/snapshot-record/snapshot-record.stub';
import { driverStatics } from '../../../statics/driver/driver-statics';
import { instanceStateResolveBrokerProxy } from '../../instance/state-resolve/instance-state-resolve-broker.proxy';
import { locationsInstanceHomePathFindBrokerProxy } from '../../locations/instance-home-path-find/locations-instance-home-path-find-broker.proxy';
import { snapshotIndexReadBrokerProxy } from '../index-read/snapshot-index-read-broker.proxy';

type RegistryEntry = ReturnType<typeof RegistryEntryStub>;
type SnapshotRecord = ReturnType<typeof SnapshotRecordStub>;

// osTmpdirAdapterProxy's own sticky default, reused rather than re-staged — so the home this proxy
// stages against is the one the real resolver computes.
const TMP_DIR_VALUE = '/tmp';

export const snapshotListBrokerProxy = (): {
  homePathFor: (params: { instanceId: InstanceId }) => AbsoluteFilePath;
  setupInstance: (params: { entry: RegistryEntry }) => void;
  setupUnknownInstance: () => void;
  setupNow: (params: { nowMs: number }) => void;
  setupNoStore: (params: { instanceId: InstanceId }) => void;
  setupIndex: (params: { instanceId: InstanceId; records: readonly SnapshotRecord[] }) => void;
} => {
  const instanceStateProxy = instanceStateResolveBrokerProxy();
  // Constructed for enforce-proxy-child-creation. Deliberately NOT given `setupHomePath`, which
  // queues a one-shot pathJoin — the real join runs instead, against the sticky `/tmp` above.
  locationsInstanceHomePathFindBrokerProxy();
  const indexReadProxy = snapshotIndexReadBrokerProxy();

  return {
    homePathFor: ({ instanceId }: { instanceId: InstanceId }): AbsoluteFilePath =>
      AbsoluteFilePathStub({
        value: `${TMP_DIR_VALUE}/${driverStatics.boot.homePrefix}${String(instanceId)}`,
      }),

    setupInstance: ({ entry }: { entry: RegistryEntry }): void => {
      instanceStateProxy.setupRegistry({ registry: RegistryStub({ instances: [entry] }) });
    },

    // A present-but-empty registry — the honest shape of a typo'd or never-existed id.
    setupUnknownInstance: (): void => {
      instanceStateProxy.setupRegistry({ registry: RegistryStub({ instances: [] }) });
    },

    setupNow: ({ nowMs }: { nowMs: number }): void => {
      instanceStateProxy.setupNow({ nowMs });
    },

    setupNoStore: ({ instanceId }: { instanceId: InstanceId }): void => {
      indexReadProxy.setupNoIndex({
        homePath: AbsoluteFilePathStub({
          value: `${TMP_DIR_VALUE}/${driverStatics.boot.homePrefix}${String(instanceId)}`,
        }),
      });
    },

    setupIndex: ({
      instanceId,
      records,
    }: {
      instanceId: InstanceId;
      records: readonly SnapshotRecord[];
    }): void => {
      indexReadProxy.setupIndex({
        homePath: AbsoluteFilePathStub({
          value: `${TMP_DIR_VALUE}/${driverStatics.boot.homePrefix}${String(instanceId)}`,
        }),
        records,
      });
    },
  };
};
