import type { DirEntrySync } from '#gateway/node/fs';
import { FsErrorStub } from '#gateway/node/fs/is-fs-error/fs-error.stub';

import { snapshotRestoreLayerBroker } from './snapshot-restore-layer-broker';
import { snapshotRestoreLayerBrokerProxy } from './snapshot-restore-layer-broker.proxy';

type FileName = string;

const makeFileEntry = ({ name }: { name: FileName }): DirEntrySync => ({
  name,
  kind: 'file',
});

const makeDirEntry = ({ name }: { name: FileName }): DirEntrySync => ({
  name,
  kind: 'directory',
});

describe('snapshotRestoreLayerBroker', () => {
  const homePath = '/tmp/instance-home';
  const payloadPath = '/tmp/instance-home/.siegelense-snapshots/1';

  it('VALID: {identical trees} => returns 0 files undid', async () => {
    const proxy = snapshotRestoreLayerBrokerProxy();
    const fileName = 'config.json';
    const filePathHome = `${homePath}/${fileName}`;
    const filePathPayload = `${payloadPath}/${fileName}`;
    const sizeBytes = 256;
    const modifiedAtMs = 1700000000000;

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
    const fileName = 'seeded.json';
    const filePathHome = `${homePath}/${fileName}`;
    const filePathPayload = `${payloadPath}/${fileName}`;
    const sizeBytes = 64;
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
        { filePath: filePathHome, sizeBytes, modifiedAtMs: 1700000000000 },
        {
          filePath: filePathPayload,
          sizeBytes,
          modifiedAtMs: 1700000005000,
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
    const fileName = 'seeded.json';
    const filePathHome = `${homePath}/${fileName}`;
    const filePathPayload = `${payloadPath}/${fileName}`;
    const sizeBytes = 15;

    proxy.setupDirectories({
      dirs: [
        { dirPath: homePath, entries: [makeFileEntry({ name: fileName })] },
        { dirPath: payloadPath, entries: [makeFileEntry({ name: fileName })] },
      ],
    });
    proxy.setupFileStats({
      stats: [
        { filePath: filePathHome, sizeBytes, modifiedAtMs: 1700000000000 },
        {
          filePath: filePathPayload,
          sizeBytes,
          modifiedAtMs: 1700000000000,
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
    const addedFileName = 'extra.txt';
    const addedFilePath = `${homePath}/${addedFileName}`;
    const existingFileName = 'base.txt';
    const existingFilePathHome = `${homePath}/${existingFileName}`;
    const existingFilePathPayload = `${payloadPath}/${existingFileName}`;
    const sizeBytes = 100;
    const modifiedAtMs = 1700000000000;

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
    const modifiedFileName = 'modified.json';
    const removedFileName = 'deleted.txt';
    const modifiedHome = `${homePath}/${modifiedFileName}`;
    const modifiedPayload = `${payloadPath}/${modifiedFileName}`;
    const removedPayload = `${payloadPath}/${removedFileName}`;

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
          sizeBytes: 50,
          modifiedAtMs: 1700000000000,
        },
        {
          filePath: modifiedPayload,
          sizeBytes: 100,
          modifiedAtMs: 1700000000000,
        },
        {
          filePath: removedPayload,
          sizeBytes: 200,
          modifiedAtMs: 1700000000000,
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
    const storeDirName = '.siegelense-snapshots';
    const fileName = 'app.ts';
    const homeFilePath = `${homePath}/${fileName}`;
    const payloadFilePath = `${payloadPath}/${fileName}`;
    const sizeBytes = 500;
    const modifiedAtMs = 1700000000000;

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

  it('VALID: {a folder created since the snapshot, holding one file} => removes the folder itself and counts it as addedFolders 1', async () => {
    const proxy = snapshotRestoreLayerBrokerProxy();
    const newDirName = 'guild-2';
    const nestedFileName = 'guild.json';
    const newDirPath = `${homePath}/${newDirName}`;
    const nestedFilePath = `${newDirPath}/${nestedFileName}`;

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
          sizeBytes: 10,
          modifiedAtMs: 1700000000000,
        },
      ],
    });
    proxy.setupRmSucceeds({ filePaths: [nestedFilePath, newDirPath] });
    proxy.setupCpSucceeds({ sourcePath: payloadPath, entries: [] });

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
    const newDirName = 'guild-2';
    const newDirPath = `${homePath}/${newDirName}`;

    proxy.setupDirectories({
      dirs: [
        { dirPath: homePath, entries: [makeDirEntry({ name: newDirName })] },
        { dirPath: newDirPath, entries: [] },
        { dirPath: payloadPath, entries: [] },
      ],
    });
    proxy.setupRmSucceeds({ filePaths: [newDirPath] });
    proxy.setupCpSucceeds({ sourcePath: payloadPath, entries: [] });

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
    const outerName = 'outer';
    const innerName = 'inner';
    const outerPath = `${homePath}/${outerName}`;
    const innerPath = `${outerPath}/${innerName}`;

    proxy.setupDirectories({
      dirs: [
        { dirPath: homePath, entries: [makeDirEntry({ name: outerName })] },
        { dirPath: outerPath, entries: [makeDirEntry({ name: innerName })] },
        { dirPath: innerPath, entries: [] },
        { dirPath: payloadPath, entries: [] },
      ],
    });
    proxy.setupRmSucceeds({ filePaths: [outerPath] });
    proxy.setupCpSucceeds({ sourcePath: payloadPath, entries: [] });

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
    const keptName = 'guild-1';
    const homeKeptPath = `${homePath}/${keptName}`;
    const payloadKeptPath = `${payloadPath}/${keptName}`;

    proxy.setupDirectories({
      dirs: [
        { dirPath: homePath, entries: [makeDirEntry({ name: keptName })] },
        { dirPath: homeKeptPath, entries: [] },
        { dirPath: payloadPath, entries: [makeDirEntry({ name: keptName })] },
        { dirPath: payloadKeptPath, entries: [] },
      ],
    });
    proxy.setupCpSucceeds({ sourcePath: payloadPath, entries: [] });

    const result = await snapshotRestoreLayerBroker({ homePath, payloadPath });

    expect(proxy.getRemovedPaths()).toStrictEqual([]);
    expect(result).toStrictEqual({ files: 0, added: 0, modified: 0, removed: 0 });
  });

  it('ERROR: {second cp fails} => rejects with the copy error and removes the first copied entry', async () => {
    const proxy = snapshotRestoreLayerBrokerProxy();
    const firstName = 'data.txt';
    const secondName = 'more.txt';
    const error = FsErrorStub({ code: 'ENOSPC', path: `${homePath}/more.txt` });

    proxy.setupDirectories({
      dirs: [
        { dirPath: homePath, entries: [] },
        { dirPath: payloadPath, entries: [makeFileEntry({ name: firstName })] },
      ],
    });
    proxy.setupFileStats({
      stats: [
        {
          filePath: `${payloadPath}/${firstName}`,
          sizeBytes: 100,
          modifiedAtMs: 1700000000000,
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
        path: `${homePath}/${firstName}`,
      }),
    ).toStrictEqual([[`${homePath}/data.txt`, { recursive: true, force: true }]]);
  });

  it('VALID: {payload holds one entry} => copies that entry from the payload into home', async () => {
    const proxy = snapshotRestoreLayerBrokerProxy();
    const fileName = 'config.json';

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
