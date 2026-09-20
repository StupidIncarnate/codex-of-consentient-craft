import { FilePathStub, GuildIdStub, QuestIdStub } from '@dungeonmaster/shared/contracts';

import { instanceReserveBroker } from './instance-reserve-broker';
import { instanceReserveBrokerProxy } from './instance-reserve-broker.proxy';
import { InstanceIdStub } from '../../../contracts/instance-id/instance-id.stub';
import { InstanceOwnerStub } from '../../../contracts/instance-owner/instance-owner.stub';
import { PortPairStub } from '../../../contracts/port-pair/port-pair.stub';
import { RegistryEntryStub } from '../../../contracts/registry-entry/registry-entry.stub';
import { RegistryStub } from '../../../contracts/registry/registry.stub';
import { SpecHashStub } from '../../../contracts/spec-hash/spec-hash.stub';
import { SpecNameStub } from '../../../contracts/spec-name/spec-name.stub';
import { PortClaimExhaustedError } from '../../../errors/port-claim-exhausted/port-claim-exhausted-error';
import { instanceLifecycleStatics } from '../../../statics/instance-lifecycle/instance-lifecycle-statics';

const HOME_DIR = '/home/user';
const HOME_PATH = FilePathStub({ value: '/home/user/.dungeonmaster' });
const ROOT_PATH = FilePathStub({ value: '/home/user/.dungeonmaster/siegelense' });
const UNOWNED_EVIDENCE_PATH = FilePathStub({
  value:
    '/home/user/.dungeonmaster/siegelense/unowned/instances/inst_7f3a9c2158cc4372a5670e02b2c3d479',
});

const FREE_PAIR = PortPairStub({ api: 40_000, web: 40_001 });
const CLAIMED_PAIR = PortPairStub({ api: 34_173, web: 34_174 });

const freePairs = (count: number): ReturnType<typeof PortPairStub>[] =>
  Array.from({ length: count }, () => FREE_PAIR);

describe('instanceReserveBroker', () => {
  describe('no port collision', () => {
    it('VALID: {registry claims an unrelated pair} => returns a reservation row and writes it', async () => {
      const proxy = instanceReserveBrokerProxy();
      const specName = SpecNameStub();
      const specHash = SpecHashStub();
      const bystander = RegistryEntryStub({
        id: InstanceIdStub({ value: 'inst_11111111' }),
        ports: PortPairStub({ api: 30_000, web: 30_001 }),
      });
      proxy.setupRegistry({ json: JSON.stringify(RegistryStub({ instances: [bystander] })) });
      proxy.setupEvidenceDir({
        homeDir: HOME_DIR,
        homePath: HOME_PATH,
        rootPath: ROOT_PATH,
        evidencePath: UNOWNED_EVIDENCE_PATH,
      });
      proxy.setupPortCandidates({ pairs: freePairs(instanceLifecycleStatics.ports.claimAttempts) });

      const result = await instanceReserveBroker({
        specName,
        specHash,
        questId: null,
        guildId: null,
      });

      const expectedEntry = RegistryEntryStub({
        id: proxy.mintedInstanceId(),
        // process.pid is a plain data property, not a function or an accessor, so
        // registerSpyOn (which wraps jest.spyOn) cannot stage it — every assertion in this file
        // compares against the REAL process.pid rather than a staged one.
        owner: InstanceOwnerStub({ value: String(process.pid) }),
        questId: null,
        guildId: null,
        specName,
        specHash,
        pid: null,
        pgids: [],
        socketPath: null,
        ports: FREE_PAIR,
        state: 'alive',
        reservedAtMs: proxy.mintedReservedAtMs(),
        bootedAtMs: null,
        lastBeatMs: null,
        prunedAtMs: null,
        prunedByRule: null,
      });

      expect(result).toStrictEqual(expectedEntry);
      expect(proxy.getWrittenRegistry()).toStrictEqual(
        RegistryStub({ instances: [bystander, expectedEntry] }),
      );
    });

    it('VALID: {registry claims an unrelated pair} => mints the instance evidence directory', async () => {
      const proxy = instanceReserveBrokerProxy();
      proxy.setupRegistry({ json: JSON.stringify(RegistryStub({ instances: [] })) });
      proxy.setupEvidenceDir({
        homeDir: HOME_DIR,
        homePath: HOME_PATH,
        rootPath: ROOT_PATH,
        evidencePath: UNOWNED_EVIDENCE_PATH,
      });
      proxy.setupPortCandidates({ pairs: freePairs(instanceLifecycleStatics.ports.claimAttempts) });

      await instanceReserveBroker({
        specName: SpecNameStub(),
        specHash: SpecHashStub(),
        questId: null,
        guildId: null,
      });

      // registryUpdateBroker's own two steps each mkdir the root — registryLockAcquireBroker
      // before its exclusive create, registryWriteBroker before its tmp-file write — so ROOT_PATH
      // appears twice ahead of the evidence directory this broker mkdirs itself, last.
      expect(proxy.getCreatedDirs()).toStrictEqual([ROOT_PATH, ROOT_PATH, UNOWNED_EVIDENCE_PATH]);
    });

    it('VALID: {questId and guildId supplied} => the written row carries them', async () => {
      const proxy = instanceReserveBrokerProxy();
      const questId = QuestIdStub();
      const guildId = GuildIdStub();
      const specName = SpecNameStub();
      const specHash = SpecHashStub();
      proxy.setupRegistry({ json: JSON.stringify(RegistryStub({ instances: [] })) });
      proxy.setupEvidenceDir({
        homeDir: HOME_DIR,
        homePath: HOME_PATH,
        rootPath: ROOT_PATH,
        evidencePath: FilePathStub({
          value: `/home/user/.dungeonmaster/siegelense/guilds/${guildId}/instances/inst_7f3a9c2158cc4372a5670e02b2c3d479`,
        }),
      });
      proxy.setupPortCandidates({ pairs: freePairs(instanceLifecycleStatics.ports.claimAttempts) });

      const result = await instanceReserveBroker({ specName, specHash, questId, guildId });

      expect(result).toStrictEqual(
        RegistryEntryStub({
          id: proxy.mintedInstanceId(),
          owner: InstanceOwnerStub({ value: String(process.pid) }),
          questId,
          guildId,
          specName,
          specHash,
          pid: null,
          pgids: [],
          socketPath: null,
          ports: FREE_PAIR,
          state: 'alive',
          reservedAtMs: proxy.mintedReservedAtMs(),
          bootedAtMs: null,
          lastBeatMs: null,
          prunedAtMs: null,
          prunedByRule: null,
        }),
      );
    });

    it('VALID: {branch detected on git HEAD} => the written row carries the branch name', async () => {
      const proxy = instanceReserveBrokerProxy();
      const specName = SpecNameStub();
      const specHash = SpecHashStub();
      proxy.setupBranch({ branch: 'feat/def-04' });
      proxy.setupRegistry({ json: JSON.stringify(RegistryStub({ instances: [] })) });
      proxy.setupEvidenceDir({
        homeDir: HOME_DIR,
        homePath: HOME_PATH,
        rootPath: ROOT_PATH,
        evidencePath: UNOWNED_EVIDENCE_PATH,
      });
      proxy.setupPortCandidates({ pairs: freePairs(instanceLifecycleStatics.ports.claimAttempts) });

      const result = await instanceReserveBroker({
        specName,
        specHash,
        questId: null,
        guildId: null,
      });

      expect(result.branch).toBe('feat/def-04');
    });
  });

  describe('port collision', () => {
    it('INVALID: {registry already claims 34173/34174} => re-rolls, returns a different pair, and writes it', async () => {
      const proxy = instanceReserveBrokerProxy();
      const specName = SpecNameStub();
      const specHash = SpecHashStub();
      const claimed = RegistryEntryStub({ ports: CLAIMED_PAIR });
      proxy.setupRegistry({ json: JSON.stringify(RegistryStub({ instances: [claimed] })) });
      proxy.setupEvidenceDir({
        homeDir: HOME_DIR,
        homePath: HOME_PATH,
        rootPath: ROOT_PATH,
        evidencePath: UNOWNED_EVIDENCE_PATH,
      });
      proxy.setupPortCandidates({
        pairs: [CLAIMED_PAIR, ...freePairs(instanceLifecycleStatics.ports.claimAttempts - 1)],
      });

      const result = await instanceReserveBroker({
        specName,
        specHash,
        questId: null,
        guildId: null,
      });

      expect(result.ports).toStrictEqual(FREE_PAIR);

      // A broker that RETURNS the re-rolled pair but WRITES a different one passes a return-only
      // check — this reads the row back through the registry proxy to close that hole.
      const expectedWrittenEntry = RegistryEntryStub({
        id: proxy.mintedInstanceId(),
        owner: InstanceOwnerStub({ value: String(process.pid) }),
        questId: null,
        guildId: null,
        specName,
        specHash,
        pid: null,
        pgids: [],
        socketPath: null,
        ports: FREE_PAIR,
        state: 'alive',
        reservedAtMs: proxy.mintedReservedAtMs(),
        bootedAtMs: null,
        lastBeatMs: null,
        prunedAtMs: null,
        prunedByRule: null,
      });

      expect(proxy.getWrittenRegistry()).toStrictEqual(
        RegistryStub({ instances: [claimed, expectedWrittenEntry] }),
      );
    });
  });

  describe('every attempt collides', () => {
    it('ERROR: {every attempt collides} => throws PortClaimExhaustedError', async () => {
      const proxy = instanceReserveBrokerProxy();
      const claimed = RegistryEntryStub({ ports: FREE_PAIR });
      proxy.setupRegistryForExhaustedClaim({
        json: JSON.stringify(RegistryStub({ instances: [claimed] })),
      });
      proxy.setupPortCandidates({ pairs: freePairs(instanceLifecycleStatics.ports.claimAttempts) });

      const expectedError = new PortClaimExhaustedError({
        attempts: instanceLifecycleStatics.ports.claimAttempts,
      });

      await expect(
        instanceReserveBroker({
          specName: SpecNameStub(),
          specHash: SpecHashStub(),
          questId: null,
          guildId: null,
        }),
      ).rejects.toThrow(expectedError.message);
    });
  });
});
