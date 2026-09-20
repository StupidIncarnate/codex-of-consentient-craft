import { FilePathStub } from '@dungeonmaster/shared/contracts';

import { EpochMsStub } from '../../../contracts/epoch-ms/epoch-ms.stub';
import { InstanceIdStub } from '../../../contracts/instance-id/instance-id.stub';
import { MegabytesStub } from '../../../contracts/megabytes/megabytes.stub';
import { RegistryEntryStub } from '../../../contracts/registry-entry/registry-entry.stub';
import { RegistryStub } from '../../../contracts/registry/registry.stub';
import { SpecNameStub } from '../../../contracts/spec-name/spec-name.stub';
import { profileStatics } from '../../../statics/profile/profile-statics';
import { laneSpecFindBroker } from '../../lane-spec/find/lane-spec-find-broker';
import { laneSpecHashBroker } from '../../lane-spec/hash/lane-spec-hash-broker';

import { profileSampleRecordBroker } from './profile-sample-record-broker';
import { profileSampleRecordBrokerProxy } from './profile-sample-record-broker.proxy';

const ROOT_PATH_VALUE = '/home/user/.dungeonmaster/siegelense';
const HEADLESS_SPEC = SpecNameStub({ value: 'dungeonmaster-api' });
const INSTANCE_ID = InstanceIdStub({ value: 'inst_7f3a9c21' });
const FIRST_BEAT_MS = 1_700_000_000_000;

// The digest is REAL — laneSpecHashBrokerProxy deliberately stages nothing, so the directory a
// record lands in is the genuine content hash of the spec, which is what makes "a changed spec
// re-measures" a property of the tree rather than of a stub.
const headlessProfilesPath = (): ReturnType<typeof FilePathStub> =>
  FilePathStub({
    value: `${ROOT_PATH_VALUE}/profiles/${laneSpecHashBroker({ spec: laneSpecFindBroker({ specName: HEADLESS_SPEC }) })}`,
  });

describe('profileSampleRecordBroker', () => {
  describe('a beat with nothing measured', () => {
    it('EMPTY: {rssMB: null} => records nothing, rather than a zero that would drag every steady figure down', async () => {
      profileSampleRecordBrokerProxy();

      const result = await profileSampleRecordBroker({
        instanceId: INSTANCE_ID,
        specName: HEADLESS_SPEC,
        rssMB: null,
        beatAtMs: EpochMsStub({ value: FIRST_BEAT_MS }),
      });

      expect(result).toBe(null);
    });
  });

  describe('the first beat of a run', () => {
    it('VALID: {one booted instance} => opens the record at pool size 1, peak set, no steady beat yet', async () => {
      const proxy = profileSampleRecordBrokerProxy();
      const profilesPath = headlessProfilesPath();
      const registry = RegistryStub({
        instances: [
          RegistryEntryStub({
            id: INSTANCE_ID,
            state: 'alive',
            bootedAtMs: EpochMsStub({ value: FIRST_BEAT_MS - 20_000 }),
          }),
        ],
      });
      proxy.setupFirstBeat({ profilesPath, instanceId: INSTANCE_ID, registry });

      const result = await profileSampleRecordBroker({
        instanceId: INSTANCE_ID,
        specName: HEADLESS_SPEC,
        rssMB: MegabytesStub({ value: 2600 }),
        beatAtMs: EpochMsStub({ value: FIRST_BEAT_MS }),
      });

      expect(result).toStrictEqual({
        instanceId: 'inst_7f3a9c21',
        specHash: String(profilesPath).split('/').at(-1),
        firstBeatAtMs: FIRST_BEAT_MS,
        measuredAtMs: FIRST_BEAT_MS,
        pools: [{ poolSize: 1, peakMB: 2600, steadySumMB: 0, steadyBeats: 0 }],
      });
      expect(proxy.getWrittenRecord({ profilesPath, instanceId: INSTANCE_ID })).toBe(
        `${JSON.stringify(result)}\n`,
      );
    });
  });

  describe('the pool size a beat is taken at', () => {
    it('VALID: {three booted instances alive} => the bucket is keyed at pool size 3', async () => {
      const proxy = profileSampleRecordBrokerProxy();
      const profilesPath = headlessProfilesPath();
      const registry = RegistryStub({
        instances: [
          RegistryEntryStub({
            id: INSTANCE_ID,
            state: 'alive',
            bootedAtMs: EpochMsStub({ value: FIRST_BEAT_MS - 20_000 }),
          }),
          RegistryEntryStub({
            id: InstanceIdStub({ value: 'inst_aaaa1111' }),
            state: 'alive',
            bootedAtMs: EpochMsStub({ value: FIRST_BEAT_MS - 30_000 }),
          }),
          RegistryEntryStub({
            id: InstanceIdStub({ value: 'inst_bbbb2222' }),
            state: 'alive',
            bootedAtMs: EpochMsStub({ value: FIRST_BEAT_MS - 40_000 }),
          }),
        ],
      });
      proxy.setupFirstBeat({ profilesPath, instanceId: INSTANCE_ID, registry });

      const result = await profileSampleRecordBroker({
        instanceId: INSTANCE_ID,
        specName: HEADLESS_SPEC,
        rssMB: MegabytesStub({ value: 2810 }),
        beatAtMs: EpochMsStub({ value: FIRST_BEAT_MS }),
      });

      expect(result?.pools).toStrictEqual([
        { poolSize: 3, peakMB: 2810, steadySumMB: 0, steadyBeats: 0 },
      ]);
    });

    it('VALID: {a reservation and a tombstone beside one booted instance} => neither counts, the pool is 1', async () => {
      const proxy = profileSampleRecordBrokerProxy();
      const profilesPath = headlessProfilesPath();
      const registry = RegistryStub({
        instances: [
          RegistryEntryStub({
            id: INSTANCE_ID,
            state: 'alive',
            bootedAtMs: EpochMsStub({ value: FIRST_BEAT_MS - 20_000 }),
          }),
          // A reservation: alive, but nothing has booted behind it yet.
          RegistryEntryStub({
            id: InstanceIdStub({ value: 'inst_aaaa1111' }),
            state: 'alive',
            bootedAtMs: null,
          }),
          // A tombstone: it booted once, and is gone.
          RegistryEntryStub({
            id: InstanceIdStub({ value: 'inst_bbbb2222' }),
            state: 'killed',
            bootedAtMs: EpochMsStub({ value: FIRST_BEAT_MS - 90_000 }),
          }),
        ],
      });
      proxy.setupFirstBeat({ profilesPath, instanceId: INSTANCE_ID, registry });

      const result = await profileSampleRecordBroker({
        instanceId: INSTANCE_ID,
        specName: HEADLESS_SPEC,
        rssMB: MegabytesStub({ value: 2600 }),
        beatAtMs: EpochMsStub({ value: FIRST_BEAT_MS }),
      });

      expect(result?.pools).toStrictEqual([
        { poolSize: 1, peakMB: 2600, steadySumMB: 0, steadyBeats: 0 },
      ]);
    });
  });

  describe('a beat onto a record already on disk', () => {
    it('VALID: {a settled beat} => merges into the existing bucket rather than replacing it', async () => {
      const proxy = profileSampleRecordBrokerProxy();
      const profilesPath = headlessProfilesPath();
      const specHash = String(profilesPath).split('/').at(-1);
      const registry = RegistryStub({
        instances: [
          RegistryEntryStub({
            id: INSTANCE_ID,
            state: 'alive',
            bootedAtMs: EpochMsStub({ value: FIRST_BEAT_MS - 20_000 }),
          }),
        ],
      });
      proxy.setupLaterBeat({
        profilesPath,
        instanceId: INSTANCE_ID,
        registry,
        existingRecordJson: JSON.stringify({
          instanceId: 'inst_7f3a9c21',
          specHash,
          firstBeatAtMs: FIRST_BEAT_MS,
          measuredAtMs: FIRST_BEAT_MS,
          pools: [{ poolSize: 1, peakMB: 2600, steadySumMB: 0, steadyBeats: 0 }],
        }),
      });

      const result = await profileSampleRecordBroker({
        instanceId: INSTANCE_ID,
        specName: HEADLESS_SPEC,
        rssMB: MegabytesStub({ value: 1800 }),
        beatAtMs: EpochMsStub({ value: FIRST_BEAT_MS + profileStatics.settle.afterMs }),
      });

      expect(result).toStrictEqual({
        instanceId: 'inst_7f3a9c21',
        specHash,
        firstBeatAtMs: FIRST_BEAT_MS,
        measuredAtMs: FIRST_BEAT_MS + profileStatics.settle.afterMs,
        pools: [{ poolSize: 1, peakMB: 2600, steadySumMB: 1800, steadyBeats: 1 }],
      });
    });

    it('ERROR: {the record on disk is not valid JSON} => starts a fresh record and reports the discard on stderr', async () => {
      const proxy = profileSampleRecordBrokerProxy();
      const profilesPath = headlessProfilesPath();
      const registry = RegistryStub({
        instances: [
          RegistryEntryStub({
            id: INSTANCE_ID,
            state: 'alive',
            bootedAtMs: EpochMsStub({ value: FIRST_BEAT_MS - 20_000 }),
          }),
        ],
      });
      proxy.setupLaterBeat({
        profilesPath,
        instanceId: INSTANCE_ID,
        registry,
        existingRecordJson: '{ this is not json',
      });

      const result = await profileSampleRecordBroker({
        instanceId: INSTANCE_ID,
        specName: HEADLESS_SPEC,
        rssMB: MegabytesStub({ value: 1800 }),
        beatAtMs: EpochMsStub({ value: FIRST_BEAT_MS + profileStatics.settle.afterMs }),
      });

      expect(result?.pools).toStrictEqual([
        { poolSize: 1, peakMB: 1800, steadySumMB: 0, steadyBeats: 0 },
      ]);
      // Split rather than matched whole: V8's own JSON parse message is worded differently between
      // Node majors, so the assertion names the path and the error CLASS, both of which are ours.
      expect(proxy.getStderrMessages().map((message) => message.split(': ')[0])).toStrictEqual([
        `[profile-sample-record] discarding an unreadable profile record at ${String(profilesPath)}/${profileStatics.dirs.samples}/inst_7f3a9c21${profileStatics.extensions.record}`,
      ]);
      expect(proxy.getStderrMessages().map((message) => message.split(': ')[1])).toStrictEqual([
        'SyntaxError',
      ]);
    });
  });
});
