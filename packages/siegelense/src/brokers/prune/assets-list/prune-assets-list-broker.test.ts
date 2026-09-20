import { AbsoluteFilePathStub, FilePathStub } from '@dungeonmaster/shared/contracts';

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
    it('VALID: {a server log, a console buffer, a transcript, a stored return and a shot} => every file with its real size and class, and run_1 as the run it holds', async () => {
      const proxy = pruneAssetsListBrokerProxy();
      proxy.setupEvidenceTree({
        homeDir: HOME_DIR,
        homePath: FilePathStub({ value: HOME }),
        rootPath: FilePathStub({ value: ROOT }),
        evidencePath: FilePathStub({ value: EVIDENCE }),
      });
      proxy.setupFile({
        filePath: AbsoluteFilePathStub({ value: `${EVIDENCE}/api-server.log` }),
        sizeBytes: 512,
        modifiedAtMs: 1_700_000_000_000,
      });
      proxy.setupFile({
        filePath: AbsoluteFilePathStub({ value: `${EVIDENCE}/console.jsonl` }),
        sizeBytes: 256,
        modifiedAtMs: 1_700_000_000_100,
      });
      proxy.setupDir({
        dirPath: AbsoluteFilePathStub({ value: RUNS }),
        entries: ['run_1.jsonl', 'run_1.json', 'run_1'],
      });
      proxy.setupFile({
        filePath: AbsoluteFilePathStub({ value: `${RUNS}/run_1.jsonl` }),
        sizeBytes: 1024,
        modifiedAtMs: 1_700_000_000_200,
      });
      proxy.setupFile({
        filePath: AbsoluteFilePathStub({ value: `${RUNS}/run_1.json` }),
        sizeBytes: 64,
        modifiedAtMs: 1_700_000_000_300,
      });
      proxy.setupDir({
        dirPath: AbsoluteFilePathStub({ value: `${RUNS}/run_1` }),
        entries: ['step1.png'],
      });
      proxy.setupFile({
        filePath: AbsoluteFilePathStub({ value: `${RUNS}/run_1/step1.png` }),
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
            kind: 'transcript',
            sizeBytes: 256,
            modifiedAtMs: 1_700_000_000_100,
          },
          {
            path: `${RUNS}/run_1.jsonl`,
            kind: 'transcript',
            sizeBytes: 1024,
            modifiedAtMs: 1_700_000_000_200,
          },
          {
            path: `${RUNS}/run_1.json`,
            kind: 'transcript',
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
        homePath: FilePathStub({ value: HOME }),
        rootPath: FilePathStub({ value: ROOT }),
        evidencePath: FilePathStub({ value: EVIDENCE }),
      });
      proxy.setupDir({
        dirPath: AbsoluteFilePathStub({ value: RUNS }),
        entries: ['run_1.jsonl', 'run_1.json', 'run_1', 'run_2.jsonl'],
      });
      proxy.setupFile({
        filePath: AbsoluteFilePathStub({ value: `${RUNS}/run_1.jsonl` }),
        sizeBytes: 1,
        modifiedAtMs: 1_700_000_000_000,
      });
      proxy.setupFile({
        filePath: AbsoluteFilePathStub({ value: `${RUNS}/run_1.json` }),
        sizeBytes: 1,
        modifiedAtMs: 1_700_000_000_000,
      });
      proxy.setupFile({
        filePath: AbsoluteFilePathStub({ value: `${RUNS}/run_2.jsonl` }),
        sizeBytes: 1,
        modifiedAtMs: 1_700_000_000_000,
      });
      proxy.setupDir({
        dirPath: AbsoluteFilePathStub({ value: `${RUNS}/run_1` }),
        entries: [],
      });
      proxy.setupDir({
        dirPath: AbsoluteFilePathStub({ value: `${RUNS}/run_2` }),
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
        homePath: FilePathStub({ value: HOME }),
        rootPath: FilePathStub({ value: ROOT }),
        evidencePath: FilePathStub({ value: EVIDENCE }),
      });
      proxy.setupDir({ dirPath: AbsoluteFilePathStub({ value: RUNS }), entries: [] });

      const result = await pruneAssetsListBroker({
        entry: RegistryEntryStub({ id: INSTANCE_ID, guildId: null, questId: null }),
      });

      expect(result).toStrictEqual({ assets: [], runIds: [] });
    });
  });

  describe('a stranger in the runs directory', () => {
    it('VALID: {a .txt beside a transcript} => the stranger is not listed, so prune can never take a file nobody has decided a window for', async () => {
      const proxy = pruneAssetsListBrokerProxy();
      proxy.setupEvidenceTree({
        homeDir: HOME_DIR,
        homePath: FilePathStub({ value: HOME }),
        rootPath: FilePathStub({ value: ROOT }),
        evidencePath: FilePathStub({ value: EVIDENCE }),
      });
      proxy.setupDir({
        dirPath: AbsoluteFilePathStub({ value: RUNS }),
        entries: ['run_1.jsonl', 'scratch.txt'],
      });
      proxy.setupFile({
        filePath: AbsoluteFilePathStub({ value: `${RUNS}/run_1.jsonl` }),
        sizeBytes: 1024,
        modifiedAtMs: 1_700_000_000_200,
      });
      proxy.setupDir({
        dirPath: AbsoluteFilePathStub({ value: `${RUNS}/run_1` }),
        entries: [],
      });

      const result = await pruneAssetsListBroker({
        entry: RegistryEntryStub({ id: INSTANCE_ID, guildId: null, questId: null }),
      });

      expect(result.assets).toStrictEqual([
        {
          path: `${RUNS}/run_1.jsonl`,
          kind: 'transcript',
          sizeBytes: 1024,
          modifiedAtMs: 1_700_000_000_200,
        },
      ]);
    });
  });
});
