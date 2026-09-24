/**
 * Drives the whole sample-write path against a REAL profile tree on disk — no mocks, no driver, no
 * browser. Five beats land: three while one instance is booted, two more once the registry holds
 * three. The point of the suite is the last assertion: `profileReadBroker` must hand those beats
 * back as TWO groups with their own numbers, never one blended row.
 */

import {
  installTestbedCreateBroker,
  BaseNameStub,
  RelativePathStub,
  FileContentStub,
} from '@dungeonmaster/testing';
import { DungeonmasterConfigStub, configDefaultsStatics } from '@dungeonmaster/config';
import { DevServerE2eProcessStub } from '@dungeonmaster/config/contracts';

import { EpochMsStub } from '../../../contracts/epoch-ms/epoch-ms.stub';
import { InstanceIdStub } from '../../../contracts/instance-id/instance-id.stub';
import { MegabytesStub } from '../../../contracts/megabytes/megabytes.stub';
import { RegistryEntryStub } from '../../../contracts/registry-entry/registry-entry.stub';
import { SpecNameStub } from '../../../contracts/spec-name/spec-name.stub';
import { profileStatics } from '../../../statics/profile/profile-statics';
import { registryUpdateBroker } from '../../registry/update/registry-update-broker';
import { profileBootRecordBroker } from '../boot-record/profile-boot-record-broker';
import { profileReadBroker } from '../read/profile-read-broker';
import { laneSpecFindBroker } from '../../lane-spec/find/lane-spec-find-broker';
import { laneSpecHashBroker } from '../../lane-spec/hash/lane-spec-hash-broker';

import { profileSampleRecordBroker } from './profile-sample-record-broker';

const HEADLESS_SPEC = SpecNameStub({ value: 'api' });
const SUBJECT_ID = InstanceIdStub({ value: 'inst_aaaa1111' });
const SECOND_ID = InstanceIdStub({ value: 'inst_bbbb2222' });
const THIRD_ID = InstanceIdStub({ value: 'inst_cccc3333' });
const FIRST_BEAT_MS = 1_757_808_000_000;
const SETTLE_MS = profileStatics.settle.afterMs;

describe('the profile sample-write path, against a real tree', () => {
  const testbed = installTestbedCreateBroker({
    baseName: BaseNameStub({ value: 'profile-sample-record' }),
  });
  const originalHome = process.env.DUNGEONMASTER_HOME;
  const originalCwd = process.cwd();

  let soloRecord: Awaited<ReturnType<typeof profileSampleRecordBroker>> = null;
  let contendedRecord: Awaited<ReturnType<typeof profileSampleRecordBroker>> = null;
  let nullReadingRecord: Awaited<ReturnType<typeof profileSampleRecordBroker>> = null;
  let profile: Awaited<ReturnType<typeof profileReadBroker>> | null = null;

  beforeAll(async () => {
    process.env.DUNGEONMASTER_HOME = testbed.guildPath;

    // laneSpecFindBroker resolves devServer.e2e.processes off a real .dungeonmaster.json — this
    // repo's own file is being rewritten by other work, so the testbed gets its own, isolated
    // under the OS tmp dir. Nothing here boots anything, so the process's own command is never run.
    testbed.writeFile({
      relativePath: RelativePathStub({ value: '.dungeonmaster.json' }),
      content: FileContentStub({
        value: JSON.stringify(
          DungeonmasterConfigStub({
            framework: 'monorepo',
            devServer: {
              devCommand: 'npm run dev',
              port: configDefaultsStatics.devServer.port.default,
              e2e: { processes: [DevServerE2eProcessStub()] },
            },
          }),
        ),
      }),
    });
    process.chdir(testbed.guildPath);

    // One booted instance: every beat below is taken at pool size 1.
    await registryUpdateBroker({
      mutate: () => ({
        instances: [
          RegistryEntryStub({
            id: SUBJECT_ID,
            state: 'alive',
            bootedAtMs: EpochMsStub({ value: FIRST_BEAT_MS - 20_000 }),
          }),
        ],
      }),
    });

    // Beat 1 — inside the settle window: peak only.
    await profileSampleRecordBroker({
      instanceId: SUBJECT_ID,
      specName: HEADLESS_SPEC,
      rssMB: MegabytesStub({ value: 2600 }),
      beatAtMs: EpochMsStub({ value: FIRST_BEAT_MS }),
    });
    // Beat 2 — past the settle window: the first steady reading.
    await profileSampleRecordBroker({
      instanceId: SUBJECT_ID,
      specName: HEADLESS_SPEC,
      rssMB: MegabytesStub({ value: 1800 }),
      beatAtMs: EpochMsStub({ value: FIRST_BEAT_MS + SETTLE_MS }),
    });
    // Beat 3 — a failed measurement: recorded nowhere, so it cannot drag steady down.
    nullReadingRecord = await profileSampleRecordBroker({
      instanceId: SUBJECT_ID,
      specName: HEADLESS_SPEC,
      rssMB: null,
      beatAtMs: EpochMsStub({ value: FIRST_BEAT_MS + SETTLE_MS + 5000 }),
    });
    // Beat 4 — a second steady reading, still solo.
    soloRecord = await profileSampleRecordBroker({
      instanceId: SUBJECT_ID,
      specName: HEADLESS_SPEC,
      rssMB: MegabytesStub({ value: 1900 }),
      beatAtMs: EpochMsStub({ value: FIRST_BEAT_MS + SETTLE_MS + 10_000 }),
    });

    // Two more instances boot: the pool this instance is running in is now three.
    await registryUpdateBroker({
      mutate: (current) => ({
        instances: [
          ...current.instances,
          RegistryEntryStub({
            id: SECOND_ID,
            state: 'alive',
            bootedAtMs: EpochMsStub({ value: FIRST_BEAT_MS }),
          }),
          RegistryEntryStub({
            id: THIRD_ID,
            state: 'alive',
            bootedAtMs: EpochMsStub({ value: FIRST_BEAT_MS }),
          }),
        ],
      }),
    });

    // Beats 5 and 6 — contended, and markedly more expensive.
    await profileSampleRecordBroker({
      instanceId: SUBJECT_ID,
      specName: HEADLESS_SPEC,
      rssMB: MegabytesStub({ value: 2810 }),
      beatAtMs: EpochMsStub({ value: FIRST_BEAT_MS + SETTLE_MS + 20_000 }),
    });
    contendedRecord = await profileSampleRecordBroker({
      instanceId: SUBJECT_ID,
      specName: HEADLESS_SPEC,
      rssMB: MegabytesStub({ value: 2000 }),
      beatAtMs: EpochMsStub({ value: FIRST_BEAT_MS + SETTLE_MS + 30_000 }),
    });

    await profileBootRecordBroker({
      instanceId: SUBJECT_ID,
      specHash: laneSpecHashBroker({ spec: await laneSpecFindBroker({ specName: HEADLESS_SPEC }) }),
      bootMs: EpochMsStub({ value: 20_000 }),
    });
    await profileBootRecordBroker({
      instanceId: SECOND_ID,
      specHash: laneSpecHashBroker({ spec: await laneSpecFindBroker({ specName: HEADLESS_SPEC }) }),
      bootMs: EpochMsStub({ value: 22_000 }),
    });

    profile = await profileReadBroker({ specName: HEADLESS_SPEC });
  }, 30_000);

  afterAll(() => {
    process.chdir(originalCwd);
    if (originalHome === undefined) {
      Reflect.deleteProperty(process.env, 'DUNGEONMASTER_HOME');
    } else {
      process.env.DUNGEONMASTER_HOME = originalHome;
    }
    testbed.cleanup();
  });

  describe('a beat with nothing measured', () => {
    it('EMPTY: {rssMB: null} => writes nothing at all', () => {
      expect(nullReadingRecord).toBe(null);
    });
  });

  describe('the record on disk after the solo beats', () => {
    it('VALID: {three solo readings, one of them inside the settle window} => one bucket at pool size 1, peak from the boot reading and steady from the two later ones', async () => {
      expect(soloRecord).toStrictEqual({
        instanceId: 'inst_aaaa1111',
        specHash: String(
          laneSpecHashBroker({ spec: await laneSpecFindBroker({ specName: HEADLESS_SPEC }) }),
        ),
        firstBeatAtMs: FIRST_BEAT_MS,
        measuredAtMs: FIRST_BEAT_MS + SETTLE_MS + 10_000,
        pools: [{ poolSize: 1, peakMB: 2600, steadySumMB: 3700, steadyBeats: 2 }],
      });
    });
  });

  describe('the record on disk once the pool grew', () => {
    it('VALID: {two contended readings} => a SECOND bucket at pool size 3, the solo bucket untouched', async () => {
      expect(contendedRecord).toStrictEqual({
        instanceId: 'inst_aaaa1111',
        specHash: String(
          laneSpecHashBroker({ spec: await laneSpecFindBroker({ specName: HEADLESS_SPEC }) }),
        ),
        firstBeatAtMs: FIRST_BEAT_MS,
        measuredAtMs: FIRST_BEAT_MS + SETTLE_MS + 30_000,
        pools: [
          { poolSize: 1, peakMB: 2600, steadySumMB: 3700, steadyBeats: 2 },
          { poolSize: 3, peakMB: 2810, steadySumMB: 4810, steadyBeats: 2 },
        ],
      });
    });
  });

  describe('what profile reads back off that tree', () => {
    it('VALID: {one run measured solo and contended} => two groups with their own steadyMB and peakMB, never one blended row', async () => {
      expect(profile).toStrictEqual({
        specName: 'api',
        processes: 1,
        hash: String(
          laneSpecHashBroker({ spec: await laneSpecFindBroker({ specName: HEADLESS_SPEC }) }),
        ),
        measuredAt: '2025-09-14',
        fromRuns: 1,
        bootMs: 21_000,
        samples: [
          { poolSize: 1, steadyMB: 1850, peakMB: 2600, runs: 1 },
          { poolSize: 3, steadyMB: 2405, peakMB: 2810, runs: 1 },
        ],
      });
    });
  });
});
