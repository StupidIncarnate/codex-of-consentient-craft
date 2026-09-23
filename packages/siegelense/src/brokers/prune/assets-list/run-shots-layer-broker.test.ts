import { AbsoluteFilePathStub } from '@dungeonmaster/shared/contracts';

import { RunIdStub } from '../../../contracts/run-id/run-id.stub';
import { runShotsLayerBroker } from './run-shots-layer-broker';
import { runShotsLayerBrokerProxy } from './run-shots-layer-broker.proxy';

const EVIDENCE = '/repo/.dungeonmaster-assets/siegelense-assets/unowned/instances/inst_9b2c0001';
const SHOTS_DIR = `${EVIDENCE}/runs/run_1`;

describe('runShotsLayerBroker', () => {
  describe('a run with captures', () => {
    it('VALID: {two shots} => both, each carrying its real size and last write', async () => {
      const proxy = runShotsLayerBrokerProxy();
      proxy.setupShotsDir({
        shotsDir: AbsoluteFilePathStub({ value: SHOTS_DIR }),
        entries: ['step1.png', 'step2.png'],
      });
      proxy.setupShotFile({
        filePath: AbsoluteFilePathStub({ value: `${SHOTS_DIR}/step1.png` }),
        sizeBytes: 4096,
        modifiedAtMs: 1_700_000_000_000,
      });
      proxy.setupShotFile({
        filePath: AbsoluteFilePathStub({ value: `${SHOTS_DIR}/step2.png` }),
        sizeBytes: 8192,
        modifiedAtMs: 1_700_000_001_000,
      });

      const result = await runShotsLayerBroker({
        evidencePath: AbsoluteFilePathStub({ value: EVIDENCE }),
        runId: RunIdStub({ value: 'run_1' }),
      });

      expect(result).toStrictEqual([
        {
          path: `${SHOTS_DIR}/step1.png`,
          kind: 'shot',
          sizeBytes: 4096,
          modifiedAtMs: 1_700_000_000_000,
        },
        {
          path: `${SHOTS_DIR}/step2.png`,
          kind: 'shot',
          sizeBytes: 8192,
          modifiedAtMs: 1_700_000_001_000,
        },
      ]);
    });

    it('VALID: {a screencast beside the shots} => classified as video, so --kind video is a real match the day one exists', async () => {
      const proxy = runShotsLayerBrokerProxy();
      proxy.setupShotsDir({
        shotsDir: AbsoluteFilePathStub({ value: SHOTS_DIR }),
        entries: ['walk.webm'],
      });
      proxy.setupShotFile({
        filePath: AbsoluteFilePathStub({ value: `${SHOTS_DIR}/walk.webm` }),
        sizeBytes: 104_857_600,
        modifiedAtMs: 1_700_000_002_000,
      });

      const result = await runShotsLayerBroker({
        evidencePath: AbsoluteFilePathStub({ value: EVIDENCE }),
        runId: RunIdStub({ value: 'run_1' }),
      });

      expect(result).toStrictEqual([
        {
          path: `${SHOTS_DIR}/walk.webm`,
          kind: 'video',
          sizeBytes: 104_857_600,
          modifiedAtMs: 1_700_000_002_000,
        },
      ]);
    });
  });

  describe('files this call does not recognise', () => {
    it('VALID: {an unrecognised entry beside a shot} => only the shot comes back, and the stranger is never even statted', async () => {
      const proxy = runShotsLayerBrokerProxy();
      proxy.setupShotsDir({
        shotsDir: AbsoluteFilePathStub({ value: SHOTS_DIR }),
        entries: ['step1.png', 'notes.txt'],
      });
      proxy.setupShotFile({
        filePath: AbsoluteFilePathStub({ value: `${SHOTS_DIR}/step1.png` }),
        sizeBytes: 4096,
        modifiedAtMs: 1_700_000_000_000,
      });

      const result = await runShotsLayerBroker({
        evidencePath: AbsoluteFilePathStub({ value: EVIDENCE }),
        runId: RunIdStub({ value: 'run_1' }),
      });

      expect(result).toStrictEqual([
        {
          path: `${SHOTS_DIR}/step1.png`,
          kind: 'shot',
          sizeBytes: 4096,
          modifiedAtMs: 1_700_000_000_000,
        },
      ]);
    });
  });

  describe('a directory that is not there', () => {
    it('EMPTY: {a run that captured nothing} => an empty list, not a throw', async () => {
      const proxy = runShotsLayerBrokerProxy();
      proxy.setupShotsDir({
        shotsDir: AbsoluteFilePathStub({ value: SHOTS_DIR }),
        entries: [],
      });

      const result = await runShotsLayerBroker({
        evidencePath: AbsoluteFilePathStub({ value: EVIDENCE }),
        runId: RunIdStub({ value: 'run_1' }),
      });

      expect(result).toStrictEqual([]);
    });
  });

  describe('a file that vanished between the listing and the weigh', () => {
    it('EDGE: {stat answers ENOENT} => the row is dropped rather than counted at an unknown size', async () => {
      const proxy = runShotsLayerBrokerProxy();
      proxy.setupShotsDir({
        shotsDir: AbsoluteFilePathStub({ value: SHOTS_DIR }),
        entries: ['step1.png', 'step2.png'],
      });
      proxy.setupShotFileMissing({
        filePath: AbsoluteFilePathStub({ value: `${SHOTS_DIR}/step1.png` }),
      });
      proxy.setupShotFile({
        filePath: AbsoluteFilePathStub({ value: `${SHOTS_DIR}/step2.png` }),
        sizeBytes: 8192,
        modifiedAtMs: 1_700_000_001_000,
      });

      const result = await runShotsLayerBroker({
        evidencePath: AbsoluteFilePathStub({ value: EVIDENCE }),
        runId: RunIdStub({ value: 'run_1' }),
      });

      expect(result).toStrictEqual([
        {
          path: `${SHOTS_DIR}/step2.png`,
          kind: 'shot',
          sizeBytes: 8192,
          modifiedAtMs: 1_700_000_001_000,
        },
      ]);
    });
  });
});
