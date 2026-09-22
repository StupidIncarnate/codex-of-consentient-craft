/**
 * PURPOSE: Writes and removes a real snapshot index at the exact absolute path
 * `locationsInstanceHomePathFindBroker` resolves for one instance —
 * `<os.tmpdir()>/dm-siege-<id>/.siegelense-snapshots/index.jsonl` — so a `flows/` suite can prove a
 * POPULATED `snapshots` answer through the real broker chain. `flows/` (and its colocated
 * `.integration.test.ts`) may import neither `brokers/` nor `node:fs`/`node:os`/`node:path`
 * (`enforce-import-dependencies`, the pre-edit lint hook), so this is the one door through — the same
 * reason `evidenceAgeHarness` and `evidenceTreeHarness` exist. `os.tmpdir()` cannot be redirected from
 * inside jest (`process.env` there is a copied object, the same reason `jest.setup-home.js` documents
 * for `HOME`), so this writes at the real, unredirected location instead of relocating it, and tracks
 * every home it creates so `cleanup` removes exactly that. `mintInstanceId` draws its entropy the same
 * way `instanceReserveBroker` does — `crypto.randomUUID()`, dashes stripped — so parallel suite runs
 * never share a directory.
 *
 * USAGE:
 * const store = snapshotStoreHarness();
 * const instanceId = store.mintInstanceId();
 * const firstPayloadPath = store.payloadPath({ instanceId, ordinal: 1 });
 * await store.writeIndex({ instanceId, records: [SnapshotRecordStub({ path: firstPayloadPath })] });
 * // ... exercise the real broker chain against instanceId ...
 * await store.cleanup(); // removes every throwaway home this harness wrote
 */

import { mkdir, writeFile } from 'fs/promises';

import type { AbsoluteFilePath } from '@dungeonmaster/shared/contracts';

import { fsRmAdapter } from '../../../src/adapters/fs/rm/fs-rm-adapter';
import { locationsInstanceHomePathFindBroker } from '../../../src/brokers/locations/instance-home-path-find/locations-instance-home-path-find-broker';
import { locationsSnapshotPathsFindBroker } from '../../../src/brokers/locations/snapshot-paths-find/locations-snapshot-paths-find-broker';
import { InstanceIdStub } from '../../../src/contracts/instance-id/instance-id.stub';
import type { InstanceId } from '../../../src/contracts/instance-id/instance-id-contract';
import { SnapshotOrdinalStub } from '../../../src/contracts/snapshot-ordinal/snapshot-ordinal.stub';
import type { SnapshotRecord } from '../../../src/contracts/snapshot-record/snapshot-record-contract';
import { instanceLifecycleStatics } from '../../../src/statics/instance-lifecycle/instance-lifecycle-statics';
import { snapshotStatics } from '../../../src/statics/snapshot/snapshot-statics';

export const snapshotStoreHarness = (): {
  mintInstanceId: () => InstanceId;
  homePath: (params: { instanceId: InstanceId }) => AbsoluteFilePath;
  payloadPath: (params: { instanceId: InstanceId; ordinal: number }) => AbsoluteFilePath;
  writeIndex: (params: {
    instanceId: InstanceId;
    records: readonly SnapshotRecord[];
  }) => Promise<void>;
  cleanup: () => Promise<void>;
} => {
  const mintedHomePaths: AbsoluteFilePath[] = [];

  const mintInstanceId = (): InstanceId => {
    const entropyHex = crypto.randomUUID().split('-').join('');
    return InstanceIdStub({
      value: `${instanceLifecycleStatics.ids.instancePrefix}${entropyHex}`,
    });
  };

  const homePath = ({ instanceId }: { instanceId: InstanceId }): AbsoluteFilePath =>
    locationsInstanceHomePathFindBroker({ instanceId });

  const payloadPath = ({
    instanceId,
    ordinal,
  }: {
    instanceId: InstanceId;
    ordinal: number;
  }): AbsoluteFilePath =>
    locationsSnapshotPathsFindBroker({
      homePath: homePath({ instanceId }),
      ordinal: SnapshotOrdinalStub({ value: ordinal }),
    }).payload;

  const writeIndex = async ({
    instanceId,
    records,
  }: {
    instanceId: InstanceId;
    records: readonly SnapshotRecord[];
  }): Promise<void> => {
    const home = homePath({ instanceId });
    const { storeDir, index } = locationsSnapshotPathsFindBroker({
      homePath: home,
      ordinal: SnapshotOrdinalStub({ value: snapshotStatics.numbering.firstPayload }),
    });

    mintedHomePaths.push(home);
    await mkdir(storeDir, { recursive: true });
    await writeFile(index, records.map((record) => `${JSON.stringify(record)}\n`).join(''));
  };

  const cleanup = async (): Promise<void> => {
    const homesToRemove = mintedHomePaths.splice(0, mintedHomePaths.length);
    await Promise.all(homesToRemove.map(async (home) => fsRmAdapter({ dirPath: home })));
  };

  return { mintInstanceId, homePath, payloadPath, writeIndex, cleanup };
};
