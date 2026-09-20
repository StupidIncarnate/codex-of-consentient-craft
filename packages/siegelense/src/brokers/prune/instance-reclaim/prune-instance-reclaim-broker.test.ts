import { AbsoluteFilePathStub, FilePathStub } from '@dungeonmaster/shared/contracts';

import { EpochMsStub } from '../../../contracts/epoch-ms/epoch-ms.stub';
import { InstanceIdStub } from '../../../contracts/instance-id/instance-id.stub';
import { PruneQueryStub } from '../../../contracts/prune-query/prune-query.stub';
import { RegistryEntryStub } from '../../../contracts/registry-entry/registry-entry.stub';
import { pruneInstanceReclaimBroker } from './prune-instance-reclaim-broker';
import { pruneInstanceReclaimBrokerProxy } from './prune-instance-reclaim-broker.proxy';

const NOW_MS = 1_700_000_000_000;
const SEVEN_DAYS_MS = 604_800_000;
const HOME_DIR = '/home/user';
const HOME = '/home/user/.dungeonmaster';
const ROOT = `${HOME}/siegelense`;
const EVIDENCE = `${ROOT}/unowned/instances/inst_9b2c0001`;
const INSTANCE_ID = InstanceIdStub({ value: 'inst_9b2c0001' });

describe('pruneInstanceReclaimBroker', () => {
  describe('a live instance', () => {
    it('VALID: {beat 2s ago} => refused before its tree is even read, whoever started it', async () => {
      pruneInstanceReclaimBrokerProxy();

      const result = await pruneInstanceReclaimBroker({
        entry: RegistryEntryStub({
          id: INSTANCE_ID,
          state: 'alive',
          questId: null,
          guildId: null,
          bootedAtMs: EpochMsStub({ value: NOW_MS - 120_000 }),
          lastBeatMs: EpochMsStub({ value: NOW_MS - 2000 }),
        }),
        query: PruneQueryStub(),
        olderThanMs: EpochMsStub({ value: SEVEN_DAYS_MS }),
        nowMs: EpochMsStub({ value: NOW_MS }),
      });

      expect(result).toStrictEqual({
        removal: null,
        refusal: { id: 'inst_9b2c0001', why: 'live — last beat 2s ago' },
        gaps: [],
      });
    });

    it('VALID: {a fresh reservation with no beat yet} => refused, because a boot in flight is not evidence to reclaim', async () => {
      pruneInstanceReclaimBrokerProxy();

      const result = await pruneInstanceReclaimBroker({
        entry: RegistryEntryStub({
          id: INSTANCE_ID,
          state: 'alive',
          questId: null,
          guildId: null,
          reservedAtMs: EpochMsStub({ value: NOW_MS - 1000 }),
          bootedAtMs: null,
          lastBeatMs: null,
        }),
        query: PruneQueryStub(),
        olderThanMs: EpochMsStub({ value: SEVEN_DAYS_MS }),
        nowMs: EpochMsStub({ value: NOW_MS }),
      });

      expect(result).toStrictEqual({
        removal: null,
        refusal: { id: 'inst_9b2c0001', why: 'reserved — booting, no beat yet' },
        gaps: [],
      });
    });

    it('VALID: {a live instance with an OLD asset} => still refused, whatever the window says', async () => {
      const proxy = pruneInstanceReclaimBrokerProxy();
      proxy.setupEvidenceTree({
        homeDir: HOME_DIR,
        homePath: FilePathStub({ value: HOME }),
        rootPath: FilePathStub({ value: ROOT }),
        evidencePath: FilePathStub({ value: EVIDENCE }),
      });
      proxy.setupFile({
        filePath: AbsoluteFilePathStub({ value: `${EVIDENCE}/api-server.log` }),
        sizeBytes: 999_999,
        modifiedAtMs: NOW_MS - SEVEN_DAYS_MS * 10,
      });

      const result = await pruneInstanceReclaimBroker({
        entry: RegistryEntryStub({
          id: INSTANCE_ID,
          state: 'alive',
          questId: null,
          guildId: null,
          bootedAtMs: EpochMsStub({ value: NOW_MS - 120_000 }),
          lastBeatMs: EpochMsStub({ value: NOW_MS - 2000 }),
        }),
        query: PruneQueryStub(),
        olderThanMs: EpochMsStub({ value: SEVEN_DAYS_MS }),
        nowMs: EpochMsStub({ value: NOW_MS }),
      });

      expect(result.removal).toBe(null);
      expect(proxy.getDeletedPaths()).toStrictEqual([]);
    });
  });

  describe('a finished instance with nothing past the window', () => {
    it('EMPTY: {a killed row whose tree is empty} => neither removed nor refused, so a sweep reports only what matters', async () => {
      const proxy = pruneInstanceReclaimBrokerProxy();
      proxy.setupEvidenceTree({
        homeDir: HOME_DIR,
        homePath: FilePathStub({ value: HOME }),
        rootPath: FilePathStub({ value: ROOT }),
        evidencePath: FilePathStub({ value: EVIDENCE }),
      });
      proxy.setupDir({ dirPath: AbsoluteFilePathStub({ value: `${EVIDENCE}/runs` }), entries: [] });

      const result = await pruneInstanceReclaimBroker({
        entry: RegistryEntryStub({
          id: INSTANCE_ID,
          state: 'killed',
          questId: null,
          guildId: null,
          bootedAtMs: EpochMsStub({ value: NOW_MS - 120_000 }),
          lastBeatMs: null,
        }),
        query: PruneQueryStub(),
        olderThanMs: EpochMsStub({ value: SEVEN_DAYS_MS }),
        nowMs: EpochMsStub({ value: NOW_MS }),
      });

      expect(result).toStrictEqual({ removal: null, refusal: null, gaps: [] });
    });

    it('VALID: {a killed row whose only asset is INSIDE the window} => nothing taken, and nothing unlinked', async () => {
      const proxy = pruneInstanceReclaimBrokerProxy();
      proxy.setupEvidenceTree({
        homeDir: HOME_DIR,
        homePath: FilePathStub({ value: HOME }),
        rootPath: FilePathStub({ value: ROOT }),
        evidencePath: FilePathStub({ value: EVIDENCE }),
      });
      proxy.setupFile({
        filePath: AbsoluteFilePathStub({ value: `${EVIDENCE}/api-server.log` }),
        sizeBytes: 512,
        modifiedAtMs: NOW_MS - 1000,
      });
      proxy.setupDir({ dirPath: AbsoluteFilePathStub({ value: `${EVIDENCE}/runs` }), entries: [] });

      const result = await pruneInstanceReclaimBroker({
        entry: RegistryEntryStub({
          id: INSTANCE_ID,
          state: 'killed',
          questId: null,
          guildId: null,
          bootedAtMs: EpochMsStub({ value: NOW_MS - 120_000 }),
          lastBeatMs: null,
        }),
        query: PruneQueryStub(),
        olderThanMs: EpochMsStub({ value: SEVEN_DAYS_MS }),
        nowMs: EpochMsStub({ value: NOW_MS }),
      });

      expect(result).toStrictEqual({ removal: null, refusal: null, gaps: [] });
      expect(proxy.getDeletedPaths()).toStrictEqual([]);
    });
  });

  describe('an unowned instance past the window', () => {
    it('VALID: {one aged log, no quest} => taken, tombstoned, and freedBytes is the real byte count', async () => {
      const proxy = pruneInstanceReclaimBrokerProxy();
      proxy.setupEvidenceTree({
        homeDir: HOME_DIR,
        homePath: FilePathStub({ value: HOME }),
        rootPath: FilePathStub({ value: ROOT }),
        evidencePath: FilePathStub({ value: EVIDENCE }),
      });
      proxy.setupFile({
        filePath: AbsoluteFilePathStub({ value: `${EVIDENCE}/api-server.log` }),
        sizeBytes: 3_145_728,
        modifiedAtMs: NOW_MS - SEVEN_DAYS_MS * 2,
      });
      proxy.setupDir({ dirPath: AbsoluteFilePathStub({ value: `${EVIDENCE}/runs` }), entries: [] });
      proxy.setupDeleteSucceeds({
        filePath: AbsoluteFilePathStub({ value: `${EVIDENCE}/api-server.log` }),
      });

      const result = await pruneInstanceReclaimBroker({
        entry: RegistryEntryStub({
          id: INSTANCE_ID,
          state: 'killed',
          questId: null,
          guildId: null,
          bootedAtMs: EpochMsStub({ value: NOW_MS - 120_000 }),
          lastBeatMs: null,
        }),
        query: PruneQueryStub(),
        olderThanMs: EpochMsStub({ value: SEVEN_DAYS_MS }),
        nowMs: EpochMsStub({ value: NOW_MS }),
      });

      expect(result).toStrictEqual({
        removal: {
          id: 'inst_9b2c0001',
          kind: null,
          freedBytes: 3_145_728,
          freedMB: 3,
          tombstoned: true,
        },
        refusal: null,
        gaps: [],
      });
      expect(proxy.getDeletedPaths()).toStrictEqual([`${EVIDENCE}/api-server.log`]);
    });

    it('VALID: {--kind shot with a log and a shot both aged} => only the shot goes, and the row is NOT tombstoned', async () => {
      const proxy = pruneInstanceReclaimBrokerProxy();
      proxy.setupEvidenceTree({
        homeDir: HOME_DIR,
        homePath: FilePathStub({ value: HOME }),
        rootPath: FilePathStub({ value: ROOT }),
        evidencePath: FilePathStub({ value: EVIDENCE }),
      });
      proxy.setupFile({
        filePath: AbsoluteFilePathStub({ value: `${EVIDENCE}/api-server.log` }),
        sizeBytes: 512,
        modifiedAtMs: NOW_MS - SEVEN_DAYS_MS * 2,
      });
      proxy.setupDir({
        dirPath: AbsoluteFilePathStub({ value: `${EVIDENCE}/runs` }),
        entries: ['run_1'],
      });
      proxy.setupDir({
        dirPath: AbsoluteFilePathStub({ value: `${EVIDENCE}/runs/run_1` }),
        entries: ['step1.png'],
      });
      proxy.setupFile({
        filePath: AbsoluteFilePathStub({ value: `${EVIDENCE}/runs/run_1/step1.png` }),
        sizeBytes: 4096,
        modifiedAtMs: NOW_MS - SEVEN_DAYS_MS * 2,
      });
      proxy.setupDeleteSucceeds({
        filePath: AbsoluteFilePathStub({ value: `${EVIDENCE}/runs/run_1/step1.png` }),
      });

      const result = await pruneInstanceReclaimBroker({
        entry: RegistryEntryStub({
          id: INSTANCE_ID,
          state: 'killed',
          questId: null,
          guildId: null,
          bootedAtMs: EpochMsStub({ value: NOW_MS - 120_000 }),
          lastBeatMs: null,
        }),
        query: PruneQueryStub({ kind: 'shot' as never }),
        olderThanMs: EpochMsStub({ value: SEVEN_DAYS_MS }),
        nowMs: EpochMsStub({ value: NOW_MS }),
      });

      expect(result).toStrictEqual({
        removal: {
          id: 'inst_9b2c0001',
          kind: 'shot',
          freedBytes: 4096,
          freedMB: 0,
          tombstoned: false,
        },
        refusal: null,
        gaps: [],
      });
      expect(proxy.getDeletedPaths()).toStrictEqual([`${EVIDENCE}/runs/run_1/step1.png`]);
    });
  });
});
