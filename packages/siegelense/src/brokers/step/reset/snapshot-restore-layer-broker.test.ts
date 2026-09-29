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
    proxy.setupFileContents({
      contents: [
        { filePath: filePathHome, content: '{"a":1}' },
        { filePath: filePathPayload, content: '{"a":1}' },
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

  it('VALID: {same size, different mtime, identical content} => does not count the file as modified (DEF-81)', async () => {
    const proxy = snapshotRestoreLayerBrokerProxy();
    const fileName = FileNameStub({ value: 'seeded.json' });
    const filePathHome = AbsoluteFilePathStub({ value: `${String(homePath)}/${String(fileName)}` });
    const filePathPayload = AbsoluteFilePathStub({
      value: `${String(payloadPath)}/${String(fileName)}`,
    });
    const sizeBytes = FileSizeBytesStub({ value: 64 });
    const content = '{"seeded":true}';

    proxy.setupDirectories({
      dirs: [
        { dirPath: homePath, entries: [makeFileEntry({ name: fileName })] },
        { dirPath: payloadPath, entries: [makeFileEntry({ name: fileName })] },
      ],
    });
    // `snapshotCaptureBroker`'s own copy stamps a fresh `modifiedAtMs` on every payload file, so
    // the two mtimes below are deliberately different even though the content is not — this is
    // exactly the shape `snapshot` immediately followed by `reset level: 'state'` produces on disk.
    proxy.setupFileStats({
      stats: [
        { filePath: filePathHome, sizeBytes, modifiedAtMs: EpochMsStub({ value: 1700000000000 }) },
        {
          filePath: filePathPayload,
          sizeBytes,
          modifiedAtMs: EpochMsStub({ value: 1700000005000 }),
        },
      ],
    });
    proxy.setupFileContents({
      contents: [
        { filePath: filePathHome, content },
        { filePath: filePathPayload, content },
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

  it('VALID: {same size, different content} => counts the file as modified', async () => {
    const proxy = snapshotRestoreLayerBrokerProxy();
    const fileName = FileNameStub({ value: 'seeded.json' });
    const filePathHome = AbsoluteFilePathStub({ value: `${String(homePath)}/${String(fileName)}` });
    const filePathPayload = AbsoluteFilePathStub({
      value: `${String(payloadPath)}/${String(fileName)}`,
    });
    const sizeBytes = FileSizeBytesStub({ value: 15 });

    proxy.setupDirectories({
      dirs: [
        { dirPath: homePath, entries: [makeFileEntry({ name: fileName })] },
        { dirPath: payloadPath, entries: [makeFileEntry({ name: fileName })] },
      ],
    });
    proxy.setupFileStats({
      stats: [
        { filePath: filePathHome, sizeBytes, modifiedAtMs: EpochMsStub({ value: 1700000000000 }) },
        {
          filePath: filePathPayload,
          sizeBytes,
          modifiedAtMs: EpochMsStub({ value: 1700000000000 }),
        },
      ],
    });
    proxy.setupFileContents({
      contents: [
        { filePath: filePathHome, content: '{"seeded":2}' },
        { filePath: filePathPayload, content: '{"seeded":1}' },
      ],
    });
    proxy.setupCpSucceeds({
      sourcePath: payloadPath,
      destinationPath: homePath,
      entries: [fileName],
    });

    const result = await snapshotRestoreLayerBroker({ homePath, payloadPath });

    expect(result).toStrictEqual({
      files: 1,
      added: 0,
      modified: 1,
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
    proxy.setupFileContents({
      contents: [
        { filePath: existingFilePathHome, content: 'base content' },
        { filePath: existingFilePathPayload, content: 'base content' },
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
    proxy.setupFileContents({
      contents: [
        { filePath: homeFilePath, content: 'export const x = 1;' },
        { filePath: payloadFilePath, content: 'export const x = 1;' },
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

  it('VALID: {a folder created since the snapshot, holding one file} => removes the folder itself and counts it as addedFolders 1', async () => {
    const proxy = snapshotRestoreLayerBrokerProxy();
    const newDirName = FileNameStub({ value: 'guild-2' });
    const nestedFileName = FileNameStub({ value: 'guild.json' });
    const newDirPath = AbsoluteFilePathStub({ value: `${String(homePath)}/${String(newDirName)}` });
    const nestedFilePath = AbsoluteFilePathStub({
      value: `${String(newDirPath)}/${String(nestedFileName)}`,
    });

    proxy.setupDirectories({
      dirs: [
        { dirPath: homePath, entries: [makeDirEntry({ name: newDirName })] },
        { dirPath: newDirPath, entries: [makeFileEntry({ name: nestedFileName })] },
        { dirPath: payloadPath, entries: [] },
      ],
    });
    proxy.setupFileStats({
      stats: [
        {
          filePath: nestedFilePath,
          sizeBytes: FileSizeBytesStub({ value: 10 }),
          modifiedAtMs: EpochMsStub({ value: 1700000000000 }),
        },
      ],
    });
    proxy.setupRmSucceeds({ filePaths: [nestedFilePath, newDirPath] });
    proxy.setupCpSucceeds({ sourcePath: payloadPath, destinationPath: homePath, entries: [] });

    const result = await snapshotRestoreLayerBroker({ homePath, payloadPath });

    expect(proxy.getRemovedPaths()).toStrictEqual([nestedFilePath, newDirPath]);
    expect(result).toStrictEqual({
      files: 1,
      added: 1,
      modified: 0,
      removed: 0,
      addedFolders: 1,
    });
  });

  it('VALID: {an empty folder created since the snapshot} => removes it and counts addedFolders 1 with no files', async () => {
    const proxy = snapshotRestoreLayerBrokerProxy();
    const newDirName = FileNameStub({ value: 'guild-2' });
    const newDirPath = AbsoluteFilePathStub({ value: `${String(homePath)}/${String(newDirName)}` });

    proxy.setupDirectories({
      dirs: [
        { dirPath: homePath, entries: [makeDirEntry({ name: newDirName })] },
        { dirPath: newDirPath, entries: [] },
        { dirPath: payloadPath, entries: [] },
      ],
    });
    proxy.setupRmSucceeds({ filePaths: [newDirPath] });
    proxy.setupCpSucceeds({ sourcePath: payloadPath, destinationPath: homePath, entries: [] });

    const result = await snapshotRestoreLayerBroker({ homePath, payloadPath });

    expect(proxy.getRemovedPaths()).toStrictEqual([newDirPath]);
    expect(result).toStrictEqual({
      files: 0,
      added: 0,
      modified: 0,
      removed: 0,
      addedFolders: 1,
    });
  });

  it('VALID: {a nested new folder chain, both new} => removes only the outermost folder but counts both', async () => {
    const proxy = snapshotRestoreLayerBrokerProxy();
    const outerName = FileNameStub({ value: 'outer' });
    const innerName = FileNameStub({ value: 'inner' });
    const outerPath = AbsoluteFilePathStub({ value: `${String(homePath)}/${String(outerName)}` });
    const innerPath = AbsoluteFilePathStub({ value: `${String(outerPath)}/${String(innerName)}` });

    proxy.setupDirectories({
      dirs: [
        { dirPath: homePath, entries: [makeDirEntry({ name: outerName })] },
        { dirPath: outerPath, entries: [makeDirEntry({ name: innerName })] },
        { dirPath: innerPath, entries: [] },
        { dirPath: payloadPath, entries: [] },
      ],
    });
    proxy.setupRmSucceeds({ filePaths: [outerPath] });
    proxy.setupCpSucceeds({ sourcePath: payloadPath, destinationPath: homePath, entries: [] });

    const result = await snapshotRestoreLayerBroker({ homePath, payloadPath });

    expect(proxy.getRemovedPaths()).toStrictEqual([outerPath]);
    expect(result).toStrictEqual({
      files: 0,
      added: 0,
      modified: 0,
      removed: 0,
      addedFolders: 2,
    });
  });

  it('VALID: {a folder the snapshot also holds} => leaves it in place and reports no addedFolders key', async () => {
    const proxy = snapshotRestoreLayerBrokerProxy();
    const keptName = FileNameStub({ value: 'guild-1' });
    const homeKeptPath = AbsoluteFilePathStub({ value: `${String(homePath)}/${String(keptName)}` });
    const payloadKeptPath = AbsoluteFilePathStub({
      value: `${String(payloadPath)}/${String(keptName)}`,
    });

    proxy.setupDirectories({
      dirs: [
        { dirPath: homePath, entries: [makeDirEntry({ name: keptName })] },
        { dirPath: homeKeptPath, entries: [] },
        { dirPath: payloadPath, entries: [makeDirEntry({ name: keptName })] },
        { dirPath: payloadKeptPath, entries: [] },
      ],
    });
    proxy.setupCpSucceeds({ sourcePath: payloadPath, destinationPath: homePath, entries: [] });

    const result = await snapshotRestoreLayerBroker({ homePath, payloadPath });

    expect(proxy.getRemovedPaths()).toStrictEqual([]);
    expect(result).toStrictEqual({ files: 0, added: 0, modified: 0, removed: 0 });
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
