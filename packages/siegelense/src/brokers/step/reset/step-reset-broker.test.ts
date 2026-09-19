import type { fsReaddirWithTypesAdapter } from '@dungeonmaster/shared/adapters';
import {
  AbsoluteFilePathStub,
  ContentTextStub,
  FileNameStub,
  GuildStub,
} from '@dungeonmaster/shared/contracts';

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
    it('VALID: with to snapshot => rewinds state and returns instance reading', async () => {
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

      expect(mockClearStorage).toHaveBeenCalledTimes(1);
      expect(result).toBe(
        '{"restored":"clean","undid":{"files":0,"added":0,"modified":0,"removed":0},"NOT_cleared":[]}',
      );
    });

    it('VALID: with reseed => runs recipe and returns reading with reseed name', async () => {
      const proxy = stepResetBrokerProxy();
      const lane = LaneSessionStub({ browser: null });
      const reseedRecipe = ContentTextStub({ value: 'guild-with-three-quests' });

      proxy.setupReseed({
        apiBaseUrl: lane.apiBaseUrl,
        guild: GuildStub({
          id: '7306b468-0f2d-4a5e-9c3b-2d1e8f0a6b41',
          name: 'Siege Guild',
          path: `${String(lane.homePath)}/siege-repo`,
          urlSlug: 'siege-guild',
        }),
        questIds: [
          ContentTextStub({ value: 'aaaaaaaa-1111-4111-8111-111111111111' }),
          ContentTextStub({ value: 'bbbbbbbb-2222-4222-8222-222222222222' }),
          ContentTextStub({ value: 'cccccccc-3333-4333-8333-333333333333' }),
        ],
      });

      const result = await stepResetBroker({
        lane,
        level: ResetLevelStub({ value: 'instance' }),
        to: null,
        reseed: reseedRecipe,
      });

      expect(result).toBe(
        '{"restored":"guild-with-three-quests","undid":{"files":0,"added":0,"modified":0,"removed":0},"NOT_cleared":[]}',
      );
    });
  });
});
