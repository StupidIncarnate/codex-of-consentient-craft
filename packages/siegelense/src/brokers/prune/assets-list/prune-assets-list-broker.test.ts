import { InstanceIdStub } from '../../../contracts/instance-id/instance-id.stub';
import { RegistryEntryStub } from '../../../contracts/registry-entry/registry-entry.stub';
import { pruneAssetsListBroker } from './prune-assets-list-broker';
import { pruneAssetsListBrokerProxy } from './prune-assets-list-broker.proxy';

const HOME_DIR = '/home/user';
const HOME = '/home/user/.dungeonmaster';
const ROOT = `${HOME}/siegelense`;
const EVIDENCE = `${ROOT}/unowned/instances/inst_9b2c0001`;
const RUNS = `${EVIDENCE}/runs`;
const INSTANCE_ID = InstanceIdStub({ value: 'inst_9b2c0001' });

describe('pruneAssetsListBroker', () => {
  describe('an instance with one run', () => {
    it('VALID: {a server log, a console buffer, a run transcript, a stored return and a shot} => every file with its real size and class, and run_1 as the run it holds', async () => {
      const proxy = pruneAssetsListBrokerProxy();
      proxy.setupEvidenceTree({
        homeDir: HOME_DIR,
        homePath: HOME,
        rootPath: ROOT,
        evidencePath: EVIDENCE,
      });
      proxy.setupFile({
        filePath: `${EVIDENCE}/api-server.log`,
        sizeBytes: 512,
        modifiedAtMs: 1_700_000_000_000,
      });
      proxy.setupFile({
        filePath: `${EVIDENCE}/console.jsonl`,
        sizeBytes: 256,
        modifiedAtMs: 1_700_000_000_100,
      });
      proxy.setupDir({
        dirPath: RUNS,
        entries: ['run_1.jsonl', 'run_1.json', 'run_1'],
      });
      proxy.setupFile({
        filePath: `${RUNS}/run_1.jsonl`,
        sizeBytes: 1024,
        modifiedAtMs: 1_700_000_000_200,
      });
      proxy.setupFile({
        filePath: `${RUNS}/run_1.json`,
        sizeBytes: 64,
        modifiedAtMs: 1_700_000_000_300,
      });
      proxy.setupDir({
        dirPath: `${RUNS}/run_1`,
        entries: ['step1.png'],
      });
      proxy.setupFile({
        filePath: `${RUNS}/run_1/step1.png`,
        sizeBytes: 4096,
        modifiedAtMs: 1_700_000_000_400,
      });

      const result = await pruneAssetsListBroker({
        entry: RegistryEntryStub({ id: INSTANCE_ID, guildId: null, questId: null }),
      });

      expect(result).toStrictEqual({
        assets: [
          {
            path: `${EVIDENCE}/api-server.log`,
            kind: 'log',
            sizeBytes: 512,
            modifiedAtMs: 1_700_000_000_000,
          },
          {
            path: `${EVIDENCE}/console.jsonl`,
            kind: 'log',
            sizeBytes: 256,
            modifiedAtMs: 1_700_000_000_100,
          },
          {
            path: `${RUNS}/run_1.jsonl`,
            kind: 'log',
            sizeBytes: 1024,
            modifiedAtMs: 1_700_000_000_200,
          },
          {
            path: `${RUNS}/run_1.json`,
            kind: 'log',
            sizeBytes: 64,
            modifiedAtMs: 1_700_000_000_300,
          },
          {
            path: `${RUNS}/run_1/step1.png`,
            kind: 'shot',
            sizeBytes: 4096,
            modifiedAtMs: 1_700_000_000_400,
          },
        ],
        runIds: ['run_1'],
      });
    });
  });

  describe('run ids', () => {
    it('VALID: {run_1.jsonl, run_1.json, run_1/, run_2.jsonl} => two run ids, deduplicated across all three forms and sorted', async () => {
      const proxy = pruneAssetsListBrokerProxy();
      proxy.setupEvidenceTree({
        homeDir: HOME_DIR,
        homePath: HOME,
        rootPath: ROOT,
        evidencePath: EVIDENCE,
      });
      proxy.setupDir({
        dirPath: RUNS,
        entries: ['run_1.jsonl', 'run_1.json', 'run_1', 'run_2.jsonl'],
      });
      proxy.setupFile({
        filePath: `${RUNS}/run_1.jsonl`,
        sizeBytes: 1,
        modifiedAtMs: 1_700_000_000_000,
      });
      proxy.setupFile({
        filePath: `${RUNS}/run_1.json`,
        sizeBytes: 1,
        modifiedAtMs: 1_700_000_000_000,
      });
      proxy.setupFile({
        filePath: `${RUNS}/run_2.jsonl`,
        sizeBytes: 1,
        modifiedAtMs: 1_700_000_000_000,
      });
      proxy.setupDir({
        dirPath: `${RUNS}/run_1`,
        entries: [],
      });
      proxy.setupDir({
        dirPath: `${RUNS}/run_2`,
        entries: [],
      });

      const result = await pruneAssetsListBroker({
        entry: RegistryEntryStub({ id: INSTANCE_ID, guildId: null, questId: null }),
      });

      expect(result.runIds).toStrictEqual(['run_1', 'run_2']);
    });
  });

  describe('an instance whose tree was already taken', () => {
    it('EMPTY: {no runs directory, no files} => no assets and no runs, rather than a throw', async () => {
      const proxy = pruneAssetsListBrokerProxy();
      proxy.setupEvidenceTree({
        homeDir: HOME_DIR,
        homePath: HOME,
        rootPath: ROOT,
        evidencePath: EVIDENCE,
      });
      proxy.setupDir({ dirPath: RUNS, entries: [] });

      const result = await pruneAssetsListBroker({
        entry: RegistryEntryStub({ id: INSTANCE_ID, guildId: null, questId: null }),
      });

      expect(result).toStrictEqual({ assets: [], runIds: [] });
    });
  });

  describe('a stranger in the runs directory', () => {
    it('VALID: {a .txt beside a run transcript} => the stranger is not listed, so prune can never take a file nobody has decided a window for', async () => {
      const proxy = pruneAssetsListBrokerProxy();
      proxy.setupEvidenceTree({
        homeDir: HOME_DIR,
        homePath: HOME,
        rootPath: ROOT,
        evidencePath: EVIDENCE,
      });
      proxy.setupDir({
        dirPath: RUNS,
        entries: ['run_1.jsonl', 'scratch.txt'],
      });
      proxy.setupFile({
        filePath: `${RUNS}/run_1.jsonl`,
        sizeBytes: 1024,
        modifiedAtMs: 1_700_000_000_200,
      });
      proxy.setupDir({
        dirPath: `${RUNS}/run_1`,
        entries: [],
      });

      const result = await pruneAssetsListBroker({
        entry: RegistryEntryStub({ id: INSTANCE_ID, guildId: null, questId: null }),
      });

      expect(result.assets).toStrictEqual([
        {
          path: `${RUNS}/run_1.jsonl`,
          kind: 'log',
          sizeBytes: 1024,
          modifiedAtMs: 1_700_000_000_200,
        },
      ]);
    });
  });

  describe('an instance whose lane recorded a screencast', () => {
    it('VALID: {a .webm in the video directory} => a video asset, weighed alongside everything else', async () => {
      const proxy = pruneAssetsListBrokerProxy();
      proxy.setupEvidenceTree({
        homeDir: HOME_DIR,
        homePath: HOME,
        rootPath: ROOT,
        evidencePath: EVIDENCE,
      });
      proxy.setupDir({ dirPath: RUNS, entries: [] });
      proxy.setupDir({
        dirPath: `${EVIDENCE}/video`,
        entries: ['a1b2c3.webm'],
      });
      proxy.setupFile({
        filePath: `${EVIDENCE}/video/a1b2c3.webm`,
        sizeBytes: 104_857_600,
        modifiedAtMs: 1_700_000_003_000,
      });

      const result = await pruneAssetsListBroker({
        entry: RegistryEntryStub({ id: INSTANCE_ID, guildId: null, questId: null }),
      });

      expect(result.assets).toStrictEqual([
        {
          path: `${EVIDENCE}/video/a1b2c3.webm`,
          kind: 'video',
          sizeBytes: 104_857_600,
          modifiedAtMs: 1_700_000_003_000,
        },
      ]);
    });
  });
});
