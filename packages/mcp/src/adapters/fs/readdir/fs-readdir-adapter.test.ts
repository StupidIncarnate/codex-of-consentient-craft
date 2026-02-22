import { fsReaddirAdapter } from './fs-readdir-adapter';
import { fsReaddirAdapterProxy } from './fs-readdir-adapter.proxy';
import { FilePathStub } from '../../../contracts/file-path/file-path.stub';
import { FolderNameStub } from '../../../contracts/folder-name/folder-name.stub';

describe('fsReaddirAdapter', () => {
  it('VALID: {filepath: "/path/to/dir"} => returns directory entries', async () => {
    const adapterProxy = fsReaddirAdapterProxy();
    const filepath = FilePathStub({ value: '/path/to/quests' });
    const expectedEntries = [
      FolderNameStub({ value: '001-add-auth' }),
      FolderNameStub({ value: '002-add-logging' }),
    ];

    adapterProxy.returns({ filepath, entries: expectedEntries });

    const result = await fsReaddirAdapter({ filepath });

    expect(result).toStrictEqual(expectedEntries);
  });

  it('VALID: {filepath: "/empty/dir"} => returns empty array', async () => {
    const adapterProxy = fsReaddirAdapterProxy();
    const filepath = FilePathStub({ value: '/empty/dir' });

    adapterProxy.returns({ filepath, entries: [] });

    const result = await fsReaddirAdapter({ filepath });

    expect(result).toStrictEqual([]);
  });

  it('ERROR: {filepath: "/nonexistent"} => throws error', async () => {
    const adapterProxy = fsReaddirAdapterProxy();
    const filepath = FilePathStub({ value: '/nonexistent' });
    const expectedError = new Error('Directory not found');

    adapterProxy.throws({ filepath, error: expectedError });

    await expect(fsReaddirAdapter({ filepath })).rejects.toThrow('Directory not found');
  });
});
