
import { CitationGapStub } from '../../../contracts/citation-gap/citation-gap.stub';
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

// The open-issue gap rides every citation resolution for an unowned (questId: null) instance —
// see citation-resolve-broker.ts's own OPEN_ISSUE_GAP.
const OPEN_ISSUE_GAP = CitationGapStub({
  why:
    'not checked: no issue record exists to check. Nothing in this repo stores an issue carrying ' +
    "a typed instanceId/runId — a workItem's own observation carries neither field and " +
    'questNoteKindContract has no issue member — so a walker records a defect as a failing test ' +
    'or as prose in a note, neither of which a resolver can match an instance against.',
});

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
          bootedAtMs: (NOW_MS - 120_000),
          lastBeatMs: (NOW_MS - 2000),
        }),
        query: PruneQueryStub(),
        olderThanMs: SEVEN_DAYS_MS,
        nowMs: NOW_MS,
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
          reservedAtMs: (NOW_MS - 1000),
          bootedAtMs: null,
          lastBeatMs: null,
        }),
        query: PruneQueryStub(),
        olderThanMs: SEVEN_DAYS_MS,
        nowMs: NOW_MS,
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
        homePath: HOME,
        rootPath: ROOT,
        evidencePath: EVIDENCE,
      });
      proxy.setupFile({
        filePath: `${EVIDENCE}/api-server.log`,
        sizeBytes: 999_999,
        modifiedAtMs: NOW_MS - SEVEN_DAYS_MS * 10,
      });

      const result = await pruneInstanceReclaimBroker({
        entry: RegistryEntryStub({
          id: INSTANCE_ID,
          state: 'alive',
          questId: null,
          guildId: null,
          bootedAtMs: (NOW_MS - 120_000),
          lastBeatMs: (NOW_MS - 2000),
        }),
        query: PruneQueryStub(),
        olderThanMs: SEVEN_DAYS_MS,
        nowMs: NOW_MS,
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
        homePath: HOME,
        rootPath: ROOT,
        evidencePath: EVIDENCE,
      });
      proxy.setupDir({ dirPath: `${EVIDENCE}/runs`, entries: [] });

      const result = await pruneInstanceReclaimBroker({
        entry: RegistryEntryStub({
          id: INSTANCE_ID,
          state: 'killed',
          questId: null,
          guildId: null,
          bootedAtMs: (NOW_MS - 120_000),
          lastBeatMs: null,
        }),
        query: PruneQueryStub(),
        olderThanMs: SEVEN_DAYS_MS,
        nowMs: NOW_MS,
      });

      expect(result).toStrictEqual({ removal: null, refusal: null, gaps: [] });
    });

    it('VALID: {a killed row whose only asset is INSIDE the window} => nothing taken, and nothing unlinked', async () => {
      const proxy = pruneInstanceReclaimBrokerProxy();
      proxy.setupEvidenceTree({
        homeDir: HOME_DIR,
        homePath: HOME,
        rootPath: ROOT,
        evidencePath: EVIDENCE,
      });
      proxy.setupFile({
        filePath: `${EVIDENCE}/api-server.log`,
        sizeBytes: 512,
        modifiedAtMs: NOW_MS - 1000,
      });
      proxy.setupDir({ dirPath: `${EVIDENCE}/runs`, entries: [] });

      const result = await pruneInstanceReclaimBroker({
        entry: RegistryEntryStub({
          id: INSTANCE_ID,
          state: 'killed',
          questId: null,
          guildId: null,
          bootedAtMs: (NOW_MS - 120_000),
          lastBeatMs: null,
        }),
        query: PruneQueryStub(),
        olderThanMs: SEVEN_DAYS_MS,
        nowMs: NOW_MS,
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
        homePath: HOME,
        rootPath: ROOT,
        evidencePath: EVIDENCE,
      });
      proxy.setupFile({
        filePath: `${EVIDENCE}/api-server.log`,
        sizeBytes: 3_145_728,
        modifiedAtMs: NOW_MS - SEVEN_DAYS_MS * 2,
      });
      proxy.setupDir({ dirPath: `${EVIDENCE}/runs`, entries: [] });
      proxy.setupDeleteSucceeds({
        filePath: `${EVIDENCE}/api-server.log`,
      });

      const result = await pruneInstanceReclaimBroker({
        entry: RegistryEntryStub({
          id: INSTANCE_ID,
          state: 'killed',
          questId: null,
          guildId: null,
          bootedAtMs: (NOW_MS - 120_000),
          lastBeatMs: null,
        }),
        query: PruneQueryStub(),
        olderThanMs: SEVEN_DAYS_MS,
        nowMs: NOW_MS,
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
        gaps: [OPEN_ISSUE_GAP],
      });
      expect(proxy.getDeletedPaths()).toStrictEqual([`${EVIDENCE}/api-server.log`]);
    });

    it('VALID: {dryRun: true, one aged log, no quest} => reports the same removal it would have made, but unlinks nothing (DEF-49)', async () => {
      const proxy = pruneInstanceReclaimBrokerProxy();
      proxy.setupEvidenceTree({
        homeDir: HOME_DIR,
        homePath: HOME,
        rootPath: ROOT,
        evidencePath: EVIDENCE,
      });
      proxy.setupFile({
        filePath: `${EVIDENCE}/api-server.log`,
        sizeBytes: 3_145_728,
        modifiedAtMs: NOW_MS - SEVEN_DAYS_MS * 2,
      });
      proxy.setupDir({ dirPath: `${EVIDENCE}/runs`, entries: [] });

      const result = await pruneInstanceReclaimBroker({
        entry: RegistryEntryStub({
          id: INSTANCE_ID,
          state: 'killed',
          questId: null,
          guildId: null,
          bootedAtMs: (NOW_MS - 120_000),
          lastBeatMs: null,
        }),
        query: PruneQueryStub(),
        olderThanMs: SEVEN_DAYS_MS,
        nowMs: NOW_MS,
        dryRun: true,
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
        gaps: [OPEN_ISSUE_GAP],
      });
      expect(proxy.getDeletedPaths()).toStrictEqual([]);
    });

    it('VALID: {--kind shot with a log and a shot both aged} => only the shot goes, and the row is NOT tombstoned', async () => {
      const proxy = pruneInstanceReclaimBrokerProxy();
      proxy.setupEvidenceTree({
        homeDir: HOME_DIR,
        homePath: HOME,
        rootPath: ROOT,
        evidencePath: EVIDENCE,
      });
      proxy.setupFile({
        filePath: `${EVIDENCE}/api-server.log`,
        sizeBytes: 512,
        modifiedAtMs: NOW_MS - SEVEN_DAYS_MS * 2,
      });
      proxy.setupDir({
        dirPath: `${EVIDENCE}/runs`,
        entries: ['run_1'],
      });
      proxy.setupDir({
        dirPath: `${EVIDENCE}/runs/run_1`,
        entries: ['step1.png'],
      });
      proxy.setupFile({
        filePath: `${EVIDENCE}/runs/run_1/step1.png`,
        sizeBytes: 4096,
        modifiedAtMs: NOW_MS - SEVEN_DAYS_MS * 2,
      });
      proxy.setupDeleteSucceeds({
        filePath: `${EVIDENCE}/runs/run_1/step1.png`,
      });

      const result = await pruneInstanceReclaimBroker({
        entry: RegistryEntryStub({
          id: INSTANCE_ID,
          state: 'killed',
          questId: null,
          guildId: null,
          bootedAtMs: (NOW_MS - 120_000),
          lastBeatMs: null,
        }),
        query: PruneQueryStub({ kind: 'shot' }),
        olderThanMs: SEVEN_DAYS_MS,
        nowMs: NOW_MS,
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
        gaps: [OPEN_ISSUE_GAP],
      });
      expect(proxy.getDeletedPaths()).toStrictEqual([`${EVIDENCE}/runs/run_1/step1.png`]);
    });

    it('VALID: {--kind transcript with a log, a run transcript+return pair and a console buffer, all aged} => nothing selected, nothing unlinked, and the row is not tombstoned', async () => {
      const proxy = pruneInstanceReclaimBrokerProxy();
      proxy.setupEvidenceTree({
        homeDir: HOME_DIR,
        homePath: HOME,
        rootPath: ROOT,
        evidencePath: EVIDENCE,
      });
      proxy.setupFile({
        filePath: `${EVIDENCE}/api-server.log`,
        sizeBytes: 512,
        modifiedAtMs: NOW_MS - SEVEN_DAYS_MS * 2,
      });
      proxy.setupFile({
        filePath: `${EVIDENCE}/console.jsonl`,
        sizeBytes: 256,
        modifiedAtMs: NOW_MS - SEVEN_DAYS_MS * 2,
      });
      proxy.setupDir({
        dirPath: `${EVIDENCE}/runs`,
        entries: ['run_1.jsonl', 'run_1.json', 'run_1'],
      });
      proxy.setupFile({
        filePath: `${EVIDENCE}/runs/run_1.jsonl`,
        sizeBytes: 1024,
        modifiedAtMs: NOW_MS - SEVEN_DAYS_MS * 2,
      });
      proxy.setupFile({
        filePath: `${EVIDENCE}/runs/run_1.json`,
        sizeBytes: 64,
        modifiedAtMs: NOW_MS - SEVEN_DAYS_MS * 2,
      });
      proxy.setupDir({
        dirPath: `${EVIDENCE}/runs/run_1`,
        entries: [],
      });

      const result = await pruneInstanceReclaimBroker({
        entry: RegistryEntryStub({
          id: INSTANCE_ID,
          state: 'killed',
          questId: null,
          guildId: null,
          bootedAtMs: (NOW_MS - 120_000),
          lastBeatMs: null,
        }),
        query: PruneQueryStub({ kind: 'transcript' }),
        olderThanMs: SEVEN_DAYS_MS,
        nowMs: NOW_MS,
      });

      expect(result).toStrictEqual({ removal: null, refusal: null, gaps: [] });
      expect(proxy.getDeletedPaths()).toStrictEqual([]);
    });

    it('VALID: {--kind video with an aged .webm in the video directory} => the video is unlinked and the row is NOT tombstoned', async () => {
      const proxy = pruneInstanceReclaimBrokerProxy();
      proxy.setupEvidenceTree({
        homeDir: HOME_DIR,
        homePath: HOME,
        rootPath: ROOT,
        evidencePath: EVIDENCE,
      });
      proxy.setupFile({
        filePath: `${EVIDENCE}/api-server.log`,
        sizeBytes: 512,
        modifiedAtMs: NOW_MS - 1000,
      });
      proxy.setupDir({
        dirPath: `${EVIDENCE}/runs`,
        entries: [],
      });
      proxy.setupDir({
        dirPath: `${EVIDENCE}/video`,
        entries: ['a1b2c3.webm'],
      });
      proxy.setupFile({
        filePath: `${EVIDENCE}/video/a1b2c3.webm`,
        sizeBytes: 104_857_600,
        modifiedAtMs: NOW_MS - SEVEN_DAYS_MS * 2,
      });
      proxy.setupDeleteSucceeds({
        filePath: `${EVIDENCE}/video/a1b2c3.webm`,
      });

      const result = await pruneInstanceReclaimBroker({
        entry: RegistryEntryStub({
          id: INSTANCE_ID,
          state: 'killed',
          questId: null,
          guildId: null,
          bootedAtMs: (NOW_MS - 120_000),
          lastBeatMs: null,
        }),
        query: PruneQueryStub({ kind: 'video' }),
        olderThanMs: SEVEN_DAYS_MS,
        nowMs: NOW_MS,
      });

      expect(result).toStrictEqual({
        removal: {
          id: 'inst_9b2c0001',
          kind: 'video',
          freedBytes: 104_857_600,
          freedMB: 100,
          tombstoned: false,
        },
        refusal: null,
        gaps: [OPEN_ISSUE_GAP],
      });
      expect(proxy.getDeletedPaths()).toStrictEqual([`${EVIDENCE}/video/a1b2c3.webm`]);
    });
  });
});
