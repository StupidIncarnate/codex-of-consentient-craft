import type { fsReaddirWithTypesAdapter } from '@dungeonmaster/shared/adapters';
import { AbsoluteFilePathStub, FileNameStub } from '@dungeonmaster/shared/contracts';

import { BrowserSessionStub } from '../../../contracts/browser-session/browser-session.stub';
import { EpochMsStub } from '../../../contracts/epoch-ms/epoch-ms.stub';
import { FileSizeBytesStub } from '../../../contracts/file-size-bytes/file-size-bytes.stub';
import { LaneSessionStub } from '../../../contracts/lane-session/lane-session.stub';
import { ResetLevelStub } from '../../../contracts/reset-level/reset-level.stub';
import { SnapshotNameStub } from '../../../contracts/snapshot-name/snapshot-name.stub';
import { SnapshotRecordStub } from '../../../contracts/snapshot-record/snapshot-record.stub';
import { stepResetBroker } from './step-reset-broker';
import { stepResetBrokerProxy } from './step-reset-broker.proxy';

type Dirent = ReturnType<typeof fsReaddirWithTypesAdapter>[0];
type FileName = ReturnType<typeof FileNameStub>;

const makeFileEntry = ({ name }: { name: FileName }): Dirent =>
  ({
    name,
    parentPath: '/stub',
    path: '/stub',
    isDirectory: () => false,
    isFile: () => true,
    isBlockDevice: () => false,
    isCharacterDevice: () => false,
    isFIFO: () => false,
    isSocket: () => false,
    isSymbolicLink: () => false,
  }) as Dirent;

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
        level: ResetLevelStub({ value: 'page' }),
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
          level: ResetLevelStub({ value: 'page' }),
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
      const payloadPath = AbsoluteFilePathStub({
        value: `${String(lane.homePath)}/.siegelense-snapshots/1`,
      });

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
      const homeFile = AbsoluteFilePathStub({
        value: `${String(lane.homePath)}/${String(fileName)}`,
      });
      const payloadFile = AbsoluteFilePathStub({
        value: `${String(payloadPath)}/${String(fileName)}`,
      });

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
            modifiedAtMs: EpochMsStub({ value: 1000 }),
          },
          {
            filePath: payloadFile,
            sizeBytes: FileSizeBytesStub({ value: 100 }),
            modifiedAtMs: EpochMsStub({ value: 1000 }),
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
        destinationPath: lane.homePath,
        entries: [fileName],
      });

      const result = await stepResetBroker({
        lane,
        level: ResetLevelStub({ value: 'state' }),
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
      const payloadPath = AbsoluteFilePathStub({
        value: `${String(lane.homePath)}/.siegelense-snapshots/1`,
      });

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
        destinationPath: lane.homePath,
        entries: [],
      });

      const result = await stepResetBroker({
        lane,
        level: ResetLevelStub({ value: 'state' }),
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
          level: ResetLevelStub({ value: 'state' }),
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
          level: ResetLevelStub({ value: 'state' }),
          to: null,
          reseed: null,
        }),
      ).rejects.toThrow(/a reset step with level "state" requires an explicit "to" snapshot name/u);
    });
  });

  describe('level: instance', () => {
    it('VALID: with to snapshot => stops the servers, rewinds, restarts them, reloads the page and returns instance reading', async () => {
      const proxy = stepResetBrokerProxy();
      const mockStopProcesses = jest.fn().mockResolvedValue({ success: true });
      const mockStartProcesses = jest.fn().mockResolvedValue({ success: true });
      const mockGoto = jest.fn().mockResolvedValue(undefined);
      const mockClearStorage = jest.fn().mockResolvedValue(undefined);
      const lane = LaneSessionStub({
        ports: { api: 34_172, web: 34_173 },
        browser: BrowserSessionStub({ goto: mockGoto, clearStorage: mockClearStorage }),
        stopProcesses: mockStopProcesses,
        startProcesses: mockStartProcesses,
      });
      const snapshotName = SnapshotNameStub({ value: 'clean' });
      const payloadPath = AbsoluteFilePathStub({
        value: `${String(lane.homePath)}/.siegelense-snapshots/1`,
      });

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
        destinationPath: lane.homePath,
        entries: [],
      });

      const result = await stepResetBroker({
        lane,
        level: ResetLevelStub({ value: 'instance' }),
        to: snapshotName,
        reseed: null,
      });

      expect(mockStopProcesses).toHaveBeenCalledTimes(1);
      expect(mockStartProcesses).toHaveBeenCalledTimes(1);
      expect(mockGoto.mock.calls).toStrictEqual([
        [{ url: 'about:blank' }],
        [{ url: 'http://dungeonmaster.localhost:34173' }],
        [{ url: 'http://dungeonmaster.localhost:34173' }],
      ]);
      expect(mockClearStorage).toHaveBeenCalledTimes(1);
      expect(result).toBe(
        '{"restored":"clean","undid":{"files":0,"added":0,"modified":0,"removed":0},"NOT_cleared":[]}',
      );
    });

    it('VALID: {browser lane} => parks the page on about:blank, stops, restarts, then loads the page, clears storage, and loads it again', async () => {
      const proxy = stepResetBrokerProxy();
      const mockStopProcesses = jest.fn().mockResolvedValue({ success: true });
      const mockStartProcesses = jest.fn().mockResolvedValue({ success: true });
      const mockGoto = jest.fn().mockResolvedValue(undefined);
      const mockClearStorage = jest.fn().mockResolvedValue(undefined);
      const lane = LaneSessionStub({
        browser: BrowserSessionStub({ goto: mockGoto, clearStorage: mockClearStorage }),
        stopProcesses: mockStopProcesses,
        startProcesses: mockStartProcesses,
      });

      proxy.setupNoSnapshots({ homePath: lane.homePath });

      await stepResetBroker({
        lane,
        level: ResetLevelStub({ value: 'instance' }),
        to: null,
        reseed: null,
      });

      const [stopOrder] = mockStopProcesses.mock.invocationCallOrder;
      const [startOrder] = mockStartProcesses.mock.invocationCallOrder;
      const [parkOrder, firstGotoOrder, secondGotoOrder] = mockGoto.mock.invocationCallOrder;
      const [clearOrder] = mockClearStorage.mock.invocationCallOrder;
      const order = [parkOrder, stopOrder, startOrder, firstGotoOrder, clearOrder, secondGotoOrder];

      expect({
        parkedOn: mockGoto.mock.calls[0],
        order,
      }).toStrictEqual({
        parkedOn: [{ url: 'about:blank' }],
        order: [...order].sort((left, right) => Number(left) - Number(right)),
      });
    });

    it('VALID: with no to and no prior captures => restarts the servers and stays at boot state — nothing to undo', async () => {
      const proxy = stepResetBrokerProxy();
      const mockStopProcesses = jest.fn().mockResolvedValue({ success: true });
      const mockStartProcesses = jest.fn().mockResolvedValue({ success: true });
      const lane = LaneSessionStub({
        browser: null,
        stopProcesses: mockStopProcesses,
        startProcesses: mockStartProcesses,
      });

      proxy.setupNoSnapshots({ homePath: lane.homePath });

      const result = await stepResetBroker({
        lane,
        level: ResetLevelStub({ value: 'instance' }),
        to: null,
        reseed: null,
      });

      expect(mockStopProcesses).toHaveBeenCalledTimes(1);
      expect(mockStartProcesses).toHaveBeenCalledTimes(1);
      expect(result).toBe(
        '{"restored":"instance","undid":{"files":0,"added":0,"modified":0,"removed":0},"NOT_cleared":[]}',
      );
    });

    it('VALID: with no to and an earlier boot capture => restores the earliest snapshot and reports what it undid', async () => {
      const proxy = stepResetBrokerProxy();
      const lane = LaneSessionStub({ browser: null });
      const bootPayloadPath = AbsoluteFilePathStub({
        value: `${String(lane.homePath)}/.siegelense-snapshots/1`,
      });
      const laterPayloadPath = AbsoluteFilePathStub({
        value: `${String(lane.homePath)}/.siegelense-snapshots/2`,
      });

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
      const seededFilePath = AbsoluteFilePathStub({
        value: `${String(lane.homePath)}/${String(seededFileName)}`,
      });

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
            modifiedAtMs: EpochMsStub({ value: 1700000000000 }),
          },
        ],
      });
      proxy.setupRestoreRmSucceeds({ filePaths: [seededFilePath] });
      proxy.setupRestoreCpSucceeds({
        sourcePath: bootPayloadPath,
        destinationPath: lane.homePath,
        entries: [],
      });

      const result = await stepResetBroker({
        lane,
        level: ResetLevelStub({ value: 'instance' }),
        to: null,
        reseed: null,
      });

      expect(result).toBe(
        '{"restored":"instance","undid":{"files":1,"added":1,"modified":0,"removed":0},"NOT_cleared":[]}',
      );
    });

    it('EMPTY: {no to, no prior captures, browser storage throws SecurityError} => reports storage skipped rather than crashing', async () => {
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
        level: ResetLevelStub({ value: 'instance' }),
        to: null,
        reseed: null,
      });

      expect(result).toBe(
        '{"restored":"instance","undid":{"files":0,"added":0,"modified":0,"removed":0},' +
          '"NOT_cleared":["browser storage (page has no origin yet)"]}',
      );
    });

    it('ERROR: {to names a missing snapshot} => still restarts the servers, then throws SnapshotMissingError', async () => {
      const proxy = stepResetBrokerProxy();
      const mockStopProcesses = jest.fn().mockResolvedValue({ success: true });
      const mockStartProcesses = jest.fn().mockResolvedValue({ success: true });
      const lane = LaneSessionStub({
        browser: null,
        stopProcesses: mockStopProcesses,
        startProcesses: mockStartProcesses,
      });

      proxy.setupNoSnapshots({ homePath: lane.homePath });

      await expect(
        stepResetBroker({
          lane,
          level: ResetLevelStub({ value: 'instance' }),
          to: SnapshotNameStub({ value: 'nonexistent' }),
          reseed: null,
        }),
      ).rejects.toThrow(/No snapshot named "nonexistent" on this instance/u);
      expect(mockStopProcesses).toHaveBeenCalledTimes(1);
      expect(mockStartProcesses).toHaveBeenCalledTimes(1);
    });

    it('ERROR: {a process does not come back} => throws the restart error and leaves the page parked on about:blank', async () => {
      const proxy = stepResetBrokerProxy();
      const mockGoto = jest.fn().mockResolvedValue(undefined);
      const mockStartProcesses = jest
        .fn()
        .mockRejectedValue(
          new Error(
            'Restarting lane stack for instance inst_1 failed: api did not come back (never answered their ready path). Logs: /repo/api-server.log. The instance is unusable — kill it and start a new one.',
          ),
        );
      const lane = LaneSessionStub({
        browser: BrowserSessionStub({ goto: mockGoto }),
        startProcesses: mockStartProcesses,
      });

      proxy.setupNoSnapshots({ homePath: lane.homePath });

      await expect(
        stepResetBroker({
          lane,
          level: ResetLevelStub({ value: 'instance' }),
          to: null,
          reseed: null,
        }),
      ).rejects.toThrow(
        /^Restarting lane stack for instance inst_1 failed: api did not come back \(never answered their ready path\)\. Logs: \/repo\/api-server\.log\. The instance is unusable — kill it and start a new one\.$/u,
      );
      expect(mockGoto.mock.calls).toStrictEqual([[{ url: 'about:blank' }]]);
    });

    it('ERROR: {a server group survives SIGKILL} => throws the stop error and neither restores nor restarts', async () => {
      stepResetBrokerProxy();
      const mockStartProcesses = jest.fn().mockResolvedValue({ success: true });
      const mockStopProcesses = jest
        .fn()
        .mockRejectedValue(new Error('process groups 1001 were still alive'));
      const lane = LaneSessionStub({
        browser: null,
        stopProcesses: mockStopProcesses,
        startProcesses: mockStartProcesses,
      });

      await expect(
        stepResetBroker({
          lane,
          level: ResetLevelStub({ value: 'instance' }),
          to: null,
          reseed: null,
        }),
      ).rejects.toThrow(/^process groups 1001 were still alive$/u);
      expect(mockStartProcesses).toHaveBeenCalledTimes(0);
    });

    // Reseed after a boot-state restore is proven at the CLI level, not here:
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
