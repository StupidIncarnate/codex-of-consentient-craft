/**
 * PURPOSE: Backdates a real evidence file's mtime, so `prune`'s and `cleanup`'s age-window
 * comparisons (`nowMs - asset.modifiedAtMs >= olderThanMs` in `prune-instance-reclaim-broker.ts`)
 * are provable against real files rather than only against the parsed window value. `flows/` (and
 * its colocated `.integration.test.ts`) may import neither `brokers/` nor `node:fs`
 * (`enforce-import-dependencies`), so this is the one door through — the same reason
 * `evidenceTreeHarness` exists. The mechanism is `packages/ward/test/harnesses/e2e-artifacts/
 * e2e-artifacts.harness.ts`'s own `backdate`: `fs/promises.utimes` takes SECONDS since the epoch,
 * not milliseconds — handing it `Date.now()` dates a file ~55,000 years into the future, which
 * reads as newer than every window and turns a deletion assertion into a false pass.
 * `seedAgingInstance` builds a whole unowned `killed` registry row with a real `.webm` and a real
 * `.png` under one run directory, both backdated together, so `cleanup`'s two-pass per-kind split
 * (`assets-age-layer-broker.ts`) can be swept in ONE call and read back on real files.
 *
 * USAGE:
 * const age = evidenceAgeHarness();
 * await age.backdateFile({ filePath: someAbsoluteFilePath, daysOld: 3 });
 * const { instanceId, videoPath, shotPath } = await age.seedAgingInstance({ daysOld: 3 });
 * age.exists({ filePath: videoPath }); // false once a sweep has taken it
 */

import { existsSync } from 'fs';
import fsPromises from 'fs/promises';

import { AbsoluteFilePathStub } from '@dungeonmaster/shared/contracts';
import type { AbsoluteFilePath } from '@dungeonmaster/shared/contracts';

import { locationsInstanceEvidencePathFindBroker } from '../../../src/brokers/locations/instance-evidence-path-find/locations-instance-evidence-path-find-broker';
import { registryUpdateBroker } from '../../../src/brokers/registry/update/registry-update-broker';
import { EpochMsStub } from '../../../src/contracts/epoch-ms/epoch-ms.stub';
import type { EpochMs } from '../../../src/contracts/epoch-ms/epoch-ms-contract';
import { InstanceIdStub } from '../../../src/contracts/instance-id/instance-id.stub';
import type { InstanceId } from '../../../src/contracts/instance-id/instance-id-contract';
import { InstanceOwnerStub } from '../../../src/contracts/instance-owner/instance-owner.stub';
import { PortPairStub } from '../../../src/contracts/port-pair/port-pair.stub';
import { RegistryEntryStub } from '../../../src/contracts/registry-entry/registry-entry.stub';
import { SpecHashStub } from '../../../src/contracts/spec-hash/spec-hash.stub';
import { SpecNameStub } from '../../../src/contracts/spec-name/spec-name.stub';

const DAY_SECONDS = 86_400;
const RUN_ID = 'run_1';
const VIDEO_FILE_NAME = 'walk.webm';
const SHOT_FILE_NAME = 'step1.png';
const VIDEO_BODY = 'w'.repeat(131);
const SHOT_BODY = 'q'.repeat(137);
const PORT_BASE = 40_030;
const PORT_STRIDE = 10;

export const evidenceAgeHarness = (): {
  backdateFile: (params: { filePath: AbsoluteFilePath; daysOld: number }) => Promise<void>;
  mtimeMs: (params: { filePath: AbsoluteFilePath }) => Promise<EpochMs>;
  exists: (params: { filePath: AbsoluteFilePath }) => boolean;
  seedAgingInstance: (params: { daysOld: number }) => Promise<{
    instanceId: InstanceId;
    videoPath: AbsoluteFilePath;
    shotPath: AbsoluteFilePath;
  }>;
} => {
  let mintedCount = 0;

  // utimes takes SECONDS since the epoch, not milliseconds — see this file's own PURPOSE.
  const backdateFile = async ({
    filePath,
    daysOld,
  }: {
    filePath: AbsoluteFilePath;
    daysOld: number;
  }): Promise<void> => {
    const when = Date.now() / 1000 - daysOld * DAY_SECONDS;
    await fsPromises.utimes(String(filePath), when, when);
  };

  const mtimeMs = async ({ filePath }: { filePath: AbsoluteFilePath }): Promise<EpochMs> => {
    const stat = await fsPromises.stat(String(filePath));
    return EpochMsStub({ value: Math.round(stat.mtimeMs) });
  };

  const exists = ({ filePath }: { filePath: AbsoluteFilePath }): boolean =>
    existsSync(String(filePath));

  const seedAgingInstance = async ({
    daysOld,
  }: {
    daysOld: number;
  }): Promise<{
    instanceId: InstanceId;
    videoPath: AbsoluteFilePath;
    shotPath: AbsoluteFilePath;
  }> => {
    mintedCount += 1;
    const instanceId = InstanceIdStub({ value: `inst_a9e0000${mintedCount}` });
    const evidenceDir = locationsInstanceEvidencePathFindBroker({ instanceId, guildId: null });
    const runDir = `${evidenceDir}/runs/${RUN_ID}`;
    await fsPromises.mkdir(runDir, { recursive: true });

    const videoPath = AbsoluteFilePathStub({ value: `${runDir}/${VIDEO_FILE_NAME}` });
    const shotPath = AbsoluteFilePathStub({ value: `${runDir}/${SHOT_FILE_NAME}` });

    await fsPromises.writeFile(String(videoPath), VIDEO_BODY);
    await fsPromises.writeFile(String(shotPath), SHOT_BODY);

    await backdateFile({ filePath: videoPath, daysOld });
    await backdateFile({ filePath: shotPath, daysOld });

    const portBase = PORT_BASE + mintedCount * PORT_STRIDE;

    await registryUpdateBroker({
      mutate: (current) => ({
        instances: [
          ...current.instances,
          RegistryEntryStub({
            id: instanceId,
            owner: InstanceOwnerStub(),
            specName: SpecNameStub(),
            specHash: SpecHashStub(),
            pid: null,
            pgids: [],
            socketPath: null,
            ports: PortPairStub({ api: portBase + 1, web: portBase + 2 }),
            state: 'killed',
            questId: null,
            guildId: null,
            reservedAtMs: EpochMsStub({ value: Date.now() - DAY_SECONDS * 1000 * (daysOld + 1) }),
            bootedAtMs: null,
            lastBeatMs: null,
            prunedAtMs: null,
            prunedByRule: null,
          }),
        ],
      }),
    });

    return { instanceId, videoPath, shotPath };
  };

  return { backdateFile, mtimeMs, exists, seedAgingInstance };
};
