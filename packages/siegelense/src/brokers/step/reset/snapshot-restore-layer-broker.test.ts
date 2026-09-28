import type { DirEntrySync } from '#gateway/node/fs';
import { FsErrorStub } from '#gateway/node/fs/is-fs-error/fs-error.stub';
import { AbsoluteFilePathStub, FileNameStub } from '@dungeonmaster/shared/contracts';

import { EpochMsStub } from '../../../contracts/epoch-ms/epoch-ms.stub';
import { FileSizeBytesStub } from '../../../contracts/file-size-bytes/file-size-bytes.stub';
import { snapshotRestoreLayerBroker } from './snapshot-restore-layer-broker';
import { snapshotRestoreLayerBrokerProxy } from './snapshot-restore-layer-broker.proxy';

type FileName = ReturnType<typeof FileNameStub>;

const makeFileEntry = ({ name }: { name: FileName }): DirEntrySync => ({
  name,
  kind: 'file',
});

const makeDirEntry = ({ name }: { name: FileName }): DirEntrySync => ({
  name,
  kind: 'directory',
});

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

  it('ERROR: {second cp fails} => rejects with the copy error and removes the first copied entry', async () => {
    const proxy = snapshotRestoreLayerBrokerProxy();
    const firstName = FileNameStub({ value: 'data.txt' });
    const secondName = FileNameStub({ value: 'more.txt' });
    const error = FsErrorStub({ code: 'ENOSPC', path: `${String(homePath)}/more.txt` });

    proxy.setupDirectories({
      dirs: [
        { dirPath: homePath, entries: [] },
        { dirPath: payloadPath, entries: [makeFileEntry({ name: firstName })] },
      ],
    });
    proxy.setupFileStats({
      stats: [
        {
          filePath: AbsoluteFilePathStub({ value: `${String(payloadPath)}/${String(firstName)}` }),
          sizeBytes: FileSizeBytesStub({ value: 100 }),
          modifiedAtMs: EpochMsStub({ value: 1700000000000 }),
        },
      ],
    });
    proxy.setupCpThrows({
      sourcePath: payloadPath,
      destinationPath: homePath,
      entries: [firstName, secondName],
      error,
    });

    await expect(snapshotRestoreLayerBroker({ homePath, payloadPath })).rejects.toBe(error);
    expect(
      proxy.getRolledBackFor({
        path: AbsoluteFilePathStub({ value: `${String(homePath)}/${String(firstName)}` }),
      }),
    ).toStrictEqual([[`${String(homePath)}/data.txt`, { recursive: true, force: true }]]);
  });

  it('VALID: {payload holds one entry} => copies that entry from the payload into home', async () => {
    const proxy = snapshotRestoreLayerBrokerProxy();
    const fileName = FileNameStub({ value: 'config.json' });

    proxy.setupDirectories({
      dirs: [
        { dirPath: homePath, entries: [] },
        { dirPath: payloadPath, entries: [] },
      ],
    });
    proxy.setupCpSucceeds({ sourcePath: payloadPath, entries: [fileName] });

    await snapshotRestoreLayerBroker({ homePath, payloadPath });

    expect(proxy.getCopiedFor({ sourcePath: payloadPath, entry: fileName })).toStrictEqual([
      [
        '/tmp/instance-home/.siegelense-snapshots/1/config.json',
        '/tmp/instance-home/config.json',
        { recursive: true, force: true },
      ],
    ]);
  });
});
