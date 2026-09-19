import type { fsReaddirWithTypesAdapter } from '@dungeonmaster/shared/adapters';
import { AbsoluteFilePathStub, FileNameStub } from '@dungeonmaster/shared/contracts';

import { EpochMsStub } from '../../../contracts/epoch-ms/epoch-ms.stub';
import { FileSizeBytesStub } from '../../../contracts/file-size-bytes/file-size-bytes.stub';
import { snapshotRestoreLayerBroker } from './snapshot-restore-layer-broker';
import { snapshotRestoreLayerBrokerProxy } from './snapshot-restore-layer-broker.proxy';

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

const makeDirEntry = ({ name }: { name: FileName }): Dirent =>
  ({
    name,
    parentPath: '/stub',
    path: '/stub',
    isDirectory: () => true,
    isFile: () => false,
    isBlockDevice: () => false,
    isCharacterDevice: () => false,
    isFIFO: () => false,
    isSocket: () => false,
    isSymbolicLink: () => false,
  }) as Dirent;

describe('snapshotRestoreLayerBroker', () => {
  const homePath = AbsoluteFilePathStub({ value: '/tmp/instance-home' });
  const payloadPath = AbsoluteFilePathStub({
    value: '/tmp/instance-home/.siegelense-snapshots/1',
  });

  it('VALID: {identical trees} => returns 0 files undid', async () => {
    const proxy = snapshotRestoreLayerBrokerProxy();
    const fileName = FileNameStub({ value: 'config.json' });
    const filePathHome = AbsoluteFilePathStub({ value: `${String(homePath)}/${String(fileName)}` });
    const filePathPayload = AbsoluteFilePathStub({
      value: `${String(payloadPath)}/${String(fileName)}`,
    });
    const sizeBytes = FileSizeBytesStub({ value: 256 });
    const modifiedAtMs = EpochMsStub({ value: 1700000000000 });

    proxy.setupDirectories({
      dirs: [
        { dirPath: homePath, entries: [makeFileEntry({ name: fileName })] },
        { dirPath: payloadPath, entries: [makeFileEntry({ name: fileName })] },
      ],
    });
    proxy.setupFileStats({
      stats: [
        { filePath: filePathHome, sizeBytes, modifiedAtMs },
        { filePath: filePathPayload, sizeBytes, modifiedAtMs },
      ],
    });
    proxy.setupCpSucceeds({
      sourcePath: payloadPath,
      destinationPath: homePath,
      entries: [fileName],
    });

    const result = await snapshotRestoreLayerBroker({ homePath, payloadPath });

    expect(result).toStrictEqual({
      files: 0,
      added: 0,
      modified: 0,
      removed: 0,
    });
  });

  it('VALID: {added file in home} => removes added file and returns diff with added count', async () => {
    const proxy = snapshotRestoreLayerBrokerProxy();
    const addedFileName = FileNameStub({ value: 'extra.txt' });
    const addedFilePath = AbsoluteFilePathStub({
      value: `${String(homePath)}/${String(addedFileName)}`,
    });
    const existingFileName = FileNameStub({ value: 'base.txt' });
    const existingFilePathHome = AbsoluteFilePathStub({
      value: `${String(homePath)}/${String(existingFileName)}`,
    });
    const existingFilePathPayload = AbsoluteFilePathStub({
      value: `${String(payloadPath)}/${String(existingFileName)}`,
    });
    const sizeBytes = FileSizeBytesStub({ value: 100 });
    const modifiedAtMs = EpochMsStub({ value: 1700000000000 });

    proxy.setupDirectories({
      dirs: [
        {
          dirPath: homePath,
          entries: [
            makeFileEntry({ name: addedFileName }),
            makeFileEntry({ name: existingFileName }),
          ],
        },
        { dirPath: payloadPath, entries: [makeFileEntry({ name: existingFileName })] },
      ],
    });
    proxy.setupFileStats({
      stats: [
        { filePath: addedFilePath, sizeBytes, modifiedAtMs },
        { filePath: existingFilePathHome, sizeBytes, modifiedAtMs },
        { filePath: existingFilePathPayload, sizeBytes, modifiedAtMs },
      ],
    });
    proxy.setupRmSucceeds({ filePaths: [addedFilePath] });
    proxy.setupCpSucceeds({
      sourcePath: payloadPath,
      destinationPath: homePath,
      entries: [existingFileName],
    });

    const result = await snapshotRestoreLayerBroker({ homePath, payloadPath });

    expect(result).toStrictEqual({
      files: 1,
      added: 1,
      modified: 0,
      removed: 0,
    });
    expect(proxy.getRemovedPaths()).toStrictEqual([addedFilePath]);
  });

  it('VALID: {modified and removed files} => computes diff correctly and restores files', async () => {
    const proxy = snapshotRestoreLayerBrokerProxy();
    const modifiedFileName = FileNameStub({ value: 'modified.json' });
    const removedFileName = FileNameStub({ value: 'deleted.txt' });
    const modifiedHome = AbsoluteFilePathStub({
      value: `${String(homePath)}/${String(modifiedFileName)}`,
    });
    const modifiedPayload = AbsoluteFilePathStub({
      value: `${String(payloadPath)}/${String(modifiedFileName)}`,
    });
    const removedPayload = AbsoluteFilePathStub({
      value: `${String(payloadPath)}/${String(removedFileName)}`,
    });

    proxy.setupDirectories({
      dirs: [
        { dirPath: homePath, entries: [makeFileEntry({ name: modifiedFileName })] },
        {
          dirPath: payloadPath,
          entries: [
            makeFileEntry({ name: modifiedFileName }),
            makeFileEntry({ name: removedFileName }),
          ],
        },
      ],
    });
    proxy.setupFileStats({
      stats: [
        {
          filePath: modifiedHome,
          sizeBytes: FileSizeBytesStub({ value: 50 }),
          modifiedAtMs: EpochMsStub({ value: 1700000000000 }),
        },
        {
          filePath: modifiedPayload,
          sizeBytes: FileSizeBytesStub({ value: 100 }),
          modifiedAtMs: EpochMsStub({ value: 1700000000000 }),
        },
        {
          filePath: removedPayload,
          sizeBytes: FileSizeBytesStub({ value: 200 }),
          modifiedAtMs: EpochMsStub({ value: 1700000000000 }),
        },
      ],
    });
    proxy.setupCpSucceeds({
      sourcePath: payloadPath,
      destinationPath: homePath,
      entries: [modifiedFileName, removedFileName],
    });

    const result = await snapshotRestoreLayerBroker({ homePath, payloadPath });

    expect(result).toStrictEqual({
      files: 2,
      added: 0,
      modified: 1,
      removed: 1,
    });
  });

  it('VALID: {home holds .siegelense-snapshots} => skips store directory from file scan', async () => {
    const proxy = snapshotRestoreLayerBrokerProxy();
    const storeDirName = FileNameStub({ value: '.siegelense-snapshots' });
    const fileName = FileNameStub({ value: 'app.ts' });
    const homeFilePath = AbsoluteFilePathStub({ value: `${String(homePath)}/${String(fileName)}` });
    const payloadFilePath = AbsoluteFilePathStub({
      value: `${String(payloadPath)}/${String(fileName)}`,
    });
    const sizeBytes = FileSizeBytesStub({ value: 500 });
    const modifiedAtMs = EpochMsStub({ value: 1700000000000 });

    proxy.setupDirectories({
      dirs: [
        {
          dirPath: homePath,
          entries: [makeDirEntry({ name: storeDirName }), makeFileEntry({ name: fileName })],
        },
        { dirPath: payloadPath, entries: [makeFileEntry({ name: fileName })] },
      ],
    });
    proxy.setupFileStats({
      stats: [
        { filePath: homeFilePath, sizeBytes, modifiedAtMs },
        { filePath: payloadFilePath, sizeBytes, modifiedAtMs },
      ],
    });
    proxy.setupCpSucceeds({
      sourcePath: payloadPath,
      destinationPath: homePath,
      entries: [fileName],
    });

    const result = await snapshotRestoreLayerBroker({ homePath, payloadPath });

    expect(result).toStrictEqual({
      files: 0,
      added: 0,
      modified: 0,
      removed: 0,
    });
  });

  it('ERROR: {cp failure} => propagates copy error', async () => {
    const proxy = snapshotRestoreLayerBrokerProxy();
    const fileName = FileNameStub({ value: 'data.txt' });

    proxy.setupDirectories({
      dirs: [
        { dirPath: homePath, entries: [] },
        { dirPath: payloadPath, entries: [makeFileEntry({ name: fileName })] },
      ],
    });
    proxy.setupFileStats({
      stats: [
        {
          filePath: AbsoluteFilePathStub({ value: `${String(payloadPath)}/${String(fileName)}` }),
          sizeBytes: FileSizeBytesStub({ value: 100 }),
          modifiedAtMs: EpochMsStub({ value: 1700000000000 }),
        },
      ],
    });
    proxy.setupCpThrows({
      sourcePath: payloadPath,
      destinationPath: homePath,
      entries: [fileName],
      error: new Error('Disk full'),
    });

    await expect(snapshotRestoreLayerBroker({ homePath, payloadPath })).rejects.toThrow(
      /Disk full/u,
    );
  });
});
