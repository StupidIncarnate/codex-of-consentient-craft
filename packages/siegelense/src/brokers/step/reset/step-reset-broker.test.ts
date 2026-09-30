import type { DirEntrySync } from '#gateway/node/fs';
import { FileNameStub } from '@dungeonmaster/shared/contracts/file-name/file-name.stub';

import { BrowserSessionStub } from '../../../contracts/browser-session/browser-session.stub';
import { FileSizeBytesStub } from '../../../contracts/file-size-bytes/file-size-bytes.stub';
import { LaneSessionStub } from '../../../contracts/lane-session/lane-session.stub';
import { SnapshotNameStub } from '../../../contracts/snapshot-name/snapshot-name.stub';
import { SnapshotRecordStub } from '../../../contracts/snapshot-record/snapshot-record.stub';
import { stepResetBroker } from './step-reset-broker';
import { stepResetBrokerProxy } from './step-reset-broker.proxy';

type FileName = ReturnType<typeof FileNameStub>;

const makeFileEntry = ({ name }: { name: FileName }): DirEntrySync => ({
  name,
  kind: 'file',
});

describe('stepResetBroker', () => {
  describe('level: page', () => {
    it('VALID: on browser lane => clears browser storage and returns reading', async () => {
      stepResetBrokerProxy();
      const mockClearStorage = jest.fn().mockResolvedValue(undefined);
      const lane = LaneSessionStub({
        browser: BrowserSessionStub({ clearStorage: mockClearStorage }),
      });

      const result = await stepResetBroker({
        lane,
        level: 'page',
        to: null,
        reseed: null,
      });

      expect(mockClearStorage).toHaveBeenCalledTimes(1);
      expect(result).toBe(
        '{"restored":"page","undid":{"files":0,"added":0,"modified":0,"removed":0},"NOT_cleared":["disk","server memory"]}',
      );
    });

    it('ERROR: on headless lane => throws BrowserStepUnsupportedError', async () => {
      stepResetBrokerProxy();
      const lane = LaneSessionStub({ browser: null });

      await expect(
        stepResetBroker({
          lane,
          level: 'page',
          to: null,
          reseed: null,
        }),
      ).rejects.toThrow(
        'Step reset { page } needs a browser, but spec dungeonmaster-stack declares browser: false — until { file } is the form that runs on a lane with no screen',
      );
    });
  });

  describe('level: state', () => {
    it('VALID: on browser lane => resolves snapshot, restores files, clears storage, and returns reading', async () => {
      const proxy = stepResetBrokerProxy();
      const mockClearStorage = jest.fn().mockResolvedValue(undefined);
      const lane = LaneSessionStub({
        browser: BrowserSessionStub({ clearStorage: mockClearStorage }),
      });
      const snapshotName = SnapshotNameStub({ value: 'clean' });
      const payloadPath = `${String(lane.homePath)}/.siegelense-snapshots/1`;

      proxy.setupSnapshots({
        homePath: lane.homePath,
        records: [
          SnapshotRecordStub({
            name: snapshotName,
            path: payloadPath,
          }),
        ],
      });

      const fileName = FileNameStub({ value: 'db.json' });
      const homeFile = `${String(lane.homePath)}/${String(fileName)}`;
      const payloadFile = `${String(payloadPath)}/${String(fileName)}`;

      proxy.setupRestoreDirectories({
        dirs: [
          { dirPath: lane.homePath, entries: [makeFileEntry({ name: fileName })] },
          { dirPath: payloadPath, entries: [makeFileEntry({ name: fileName })] },
        ],
      });
      proxy.setupRestoreFileStats({
        stats: [
          {
            filePath: homeFile,
            sizeBytes: FileSizeBytesStub({ value: 100 }),
            modifiedAtMs: 1000,
          },
          {
            filePath: payloadFile,
            sizeBytes: FileSizeBytesStub({ value: 100 }),
            modifiedAtMs: 1000,
          },
        ],
      });
      proxy.setupRestoreFileContents({
        contents: [
          { filePath: homeFile, content: '{"guilds":[]}' },
          { filePath: payloadFile, content: '{"guilds":[]}' },
        ],
      });
      proxy.setupRestoreCpSucceeds({
        sourcePath: payloadPath,
        entries: [fileName],
      });

      const result = await stepResetBroker({
        lane,
        level: 'state',
        to: snapshotName,
        reseed: null,
      });

      expect(mockClearStorage).toHaveBeenCalledTimes(1);
      expect(result).toBe(
        '{"restored":"clean","undid":{"files":0,"added":0,"modified":0,"removed":0},"NOT_cleared":["server memory","open websockets"]}',
      );
    });

    it('VALID: on headless lane => restores files browserless without throwing', async () => {
      const proxy = stepResetBrokerProxy();
      const lane = LaneSessionStub({ browser: null });
      const snapshotName = SnapshotNameStub({ value: 'init' });
      const payloadPath = `${String(lane.homePath)}/.siegelense-snapshots/1`;

      proxy.setupSnapshots({
        homePath: lane.homePath,
        records: [
          SnapshotRecordStub({
            name: snapshotName,
            path: payloadPath,
          }),
        ],
      });
      proxy.setupRestoreDirectories({
        dirs: [
          { dirPath: lane.homePath, entries: [] },
          { dirPath: payloadPath, entries: [] },
        ],
      });
      proxy.setupRestoreCpSucceeds({
        sourcePath: payloadPath,
        entries: [],
      });

      const result = await stepResetBroker({
        lane,
        level: 'state',
        to: snapshotName,
        reseed: null,
      });

      expect(result).toBe(
        '{"restored":"init","undid":{"files":0,"added":0,"modified":0,"removed":0},"NOT_cleared":["server memory","open websockets"]}',
      );
    });

    it('ERROR: missing snapshot => throws SnapshotMissingError', async () => {
      const proxy = stepResetBrokerProxy();
      const lane = LaneSessionStub();
      const snapshotName = SnapshotNameStub({ value: 'nonexistent' });

      proxy.setupNoSnapshots({ homePath: lane.homePath });

      await expect(
        stepResetBroker({
          lane,
          level: 'state',
          to: snapshotName,
          reseed: null,
        }),
      ).rejects.toThrow(/No snapshot named "nonexistent" on this instance/u);
    });

    it('ERROR: state reset with to null => throws error requiring explicit to', async () => {
      stepResetBrokerProxy();
      const lane = LaneSessionStub();

      await expect(
        stepResetBroker({
          lane,
          level: 'state',
          to: null,
          reseed: null,
        }),
      ).rejects.toThrow(/a reset step with level "state" requires an explicit "to" snapshot name/u);
    });
  });

  describe('level: instance', () => {
    it('VALID: with to snapshot => rewinds state and returns instance reading', async () => {
      const proxy = stepResetBrokerProxy();
      const mockClearStorage = jest.fn().mockResolvedValue(undefined);
      const lane = LaneSessionStub({
        browser: BrowserSessionStub({ clearStorage: mockClearStorage }),
      });
      const snapshotName = SnapshotNameStub({ value: 'clean' });
      const payloadPath = `${String(lane.homePath)}/.siegelense-snapshots/1`;

      proxy.setupSnapshots({
        homePath: lane.homePath,
        records: [
          SnapshotRecordStub({
            name: snapshotName,
            path: payloadPath,
          }),
        ],
      });
      proxy.setupRestoreDirectories({
        dirs: [
          { dirPath: lane.homePath, entries: [] },
          { dirPath: payloadPath, entries: [] },
        ],
      });
      proxy.setupRestoreCpSucceeds({
        sourcePath: payloadPath,
        entries: [],
      });

      const result = await stepResetBroker({
        lane,
        level: 'instance',
        to: snapshotName,
        reseed: null,
      });

      expect(mockClearStorage).toHaveBeenCalledTimes(1);
      expect(result).toBe(
        '{"restored":"clean","undid":{"files":0,"added":0,"modified":0,"removed":0},"NOT_cleared":["server memory","open websockets"]}',
      );
    });

    it('VALID: with no to and no prior captures => stays at boot state — nothing to undo', async () => {
      const proxy = stepResetBrokerProxy();
      const lane = LaneSessionStub({ browser: null });

      proxy.setupNoSnapshots({ homePath: lane.homePath });

      const result = await stepResetBroker({
        lane,
        level: 'instance',
        to: null,
        reseed: null,
      });

      expect(result).toBe(
        '{"restored":"instance","undid":{"files":0,"added":0,"modified":0,"removed":0},"NOT_cleared":["server memory","open websockets"]}',
      );
    });

    it('VALID: with no to and an earlier boot capture => restores the earliest snapshot and reports what it undid (DEF-82)', async () => {
      const proxy = stepResetBrokerProxy();
      const lane = LaneSessionStub({ browser: null });
      const bootPayloadPath = `${String(lane.homePath)}/.siegelense-snapshots/1`;
      const laterPayloadPath = `${String(lane.homePath)}/.siegelense-snapshots/2`;

      // The index in RAW capture order: run_1:start is the earliest — the boot state — and
      // run_1:end postdates the seed step that ran between them.
      proxy.setupSnapshots({
        homePath: lane.homePath,
        records: [
          SnapshotRecordStub({
            name: SnapshotNameStub({ value: 'run_1:start' }),
            path: bootPayloadPath,
          }),
          SnapshotRecordStub({
            name: SnapshotNameStub({ value: 'run_1:end' }),
            path: laterPayloadPath,
          }),
        ],
      });

      const seededFileName = FileNameStub({ value: 'guild-1.json' });
      const seededFilePath = `${String(lane.homePath)}/${String(seededFileName)}`;

      proxy.setupRestoreDirectories({
        dirs: [
          { dirPath: lane.homePath, entries: [makeFileEntry({ name: seededFileName })] },
          { dirPath: bootPayloadPath, entries: [] },
        ],
      });
      proxy.setupRestoreFileStats({
        stats: [
          {
            filePath: seededFilePath,
            sizeBytes: FileSizeBytesStub({ value: 42 }),
            modifiedAtMs: 1700000000000,
          },
        ],
      });
      proxy.setupRestoreRmSucceeds({ filePaths: [seededFilePath] });
      proxy.setupRestoreCpSucceeds({
        sourcePath: bootPayloadPath,
        entries: [],
      });

      const result = await stepResetBroker({
        lane,
        level: 'instance',
        to: null,
        reseed: null,
      });

      expect(result).toBe(
        '{"restored":"instance","undid":{"files":1,"added":1,"modified":0,"removed":0},"NOT_cleared":["server memory","open websockets"]}',
      );
    });

    it('EMPTY: {no to, no prior captures, browser page has no origin} => rewinds nothing, but reports storage skipped rather than crashing (DEF-94)', async () => {
      const proxy = stepResetBrokerProxy();
      const securityError = new Error(
        "page.evaluate: SecurityError: Failed to read the 'localStorage' property from " +
          "'Window': Access is denied for this document.",
      );
      const mockClearStorage = jest.fn().mockRejectedValue(securityError);
      const lane = LaneSessionStub({
        browser: BrowserSessionStub({ clearStorage: mockClearStorage }),
      });

      proxy.setupNoSnapshots({ homePath: lane.homePath });

      const result = await stepResetBroker({
        lane,
        level: 'instance',
        to: null,
        reseed: null,
      });

      expect(result).toBe(
        '{"restored":"instance","undid":{"files":0,"added":0,"modified":0,"removed":0},' +
          '"NOT_cleared":["server memory","open websockets","browser storage (page has no origin yet)"]}',
      );
    });

    // Reseed after a boot-state restore (SL-110) is proven at the CLI level, not here:
    // `recipeSeedRunBrokerProxy`'s `stageEntry()` stages `pathJoinAdapter` (the shared, real
    // `path.join`) through a call-order-scoped, argument-blind one-shot queue — see
    // `locations-snapshot-paths-find-broker.proxy.ts`'s own comment on why THIS broker's joins are
    // deliberately left unstaged (a real passthrough, so nothing else's queue can answer them by
    // mistake). Every `level: 'instance'` reset now consults the snapshot index first (the fix
    // above), so combining it with `setupReseed` in one unit test lets that queue answer the
    // location broker's joins instead of `recipesLocateBroker`'s. There is no address on
    // `pathJoinAdapterProxy` narrow enough to fix this without touching an adapter proxy, which is
    // out of scope here. See POST-BUILD CHECK for the real-process repro.
  });
});
