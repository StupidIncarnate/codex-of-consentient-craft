import { fsReaddirSyncAdapter } from './fs-readdir-sync-adapter';
import { fsReaddirSyncAdapterProxy } from './fs-readdir-sync-adapter.proxy';
import { FilePathStub } from '@dungeonmaster/shared/contracts';
import { FileNameStub } from '../../../contracts/file-name/file-name.stub';

describe('fsReaddirSyncAdapter', () => {
  it('VALID: {dirPath: a folder with mixed entries} => returns each name tagged with isDirectory', () => {
    const proxy = fsReaddirSyncAdapterProxy();
    const dirPath = FilePathStub({ value: '/repo/packages/node/src' });
    const fsName = FileNameStub({ value: 'fs' });
    const bufferName = FileNameStub({ value: 'buffer' });
    const jestConfigName = FileNameStub({ value: 'jest.config.js' });
    proxy.returns({
      dirPath,
      entries: [
        { name: fsName, isDirectory: true },
        { name: bufferName, isDirectory: true },
        { name: jestConfigName, isDirectory: false },
      ],
    });

    const result = fsReaddirSyncAdapter({ dirPath });

    expect(result).toStrictEqual([
      { name: fsName, isDirectory: true },
      { name: bufferName, isDirectory: true },
      { name: jestConfigName, isDirectory: false },
    ]);
  });

  it('EMPTY: {dirPath: an empty folder} => returns an empty array', () => {
    const proxy = fsReaddirSyncAdapterProxy();
    const dirPath = FilePathStub({ value: '/repo/packages/node/src/empty' });
    proxy.returns({ dirPath, entries: [] });

    const result = fsReaddirSyncAdapter({ dirPath });

    expect(result).toStrictEqual([]);
  });
});
