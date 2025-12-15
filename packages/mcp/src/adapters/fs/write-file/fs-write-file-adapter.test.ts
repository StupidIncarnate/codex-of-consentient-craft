import { fsWriteFileAdapter } from './fs-write-file-adapter';
import { fsWriteFileAdapterProxy } from './fs-write-file-adapter.proxy';
import { FilePathStub } from '../../../contracts/file-path/file-path.stub';
import { FileContentsStub } from '../../../contracts/file-contents/file-contents.stub';

describe('fsWriteFileAdapter', () => {
  it('VALID: {filepath: "/path/to/file.json", contents: "..."} => writes file successfully', async () => {
    const adapterProxy = fsWriteFileAdapterProxy();
    const filepath = FilePathStub({ value: '/path/to/quest.json' });
    const contents = FileContentsStub({
      value: '{"id": "test-quest", "title": "Test Quest"}',
    });

    adapterProxy.succeeds({ filepath, contents });

    await expect(fsWriteFileAdapter({ filepath, contents })).resolves.toBeUndefined();
  });

  it('ERROR: {filepath: "/readonly/file.json", contents: "..."} => throws error', async () => {
    const adapterProxy = fsWriteFileAdapterProxy();
    const filepath = FilePathStub({ value: '/readonly/file.json' });
    const contents = FileContentsStub({ value: '{"data": "test"}' });
    const expectedError = new Error('Permission denied');

    adapterProxy.throws({ filepath, error: expectedError });

    await expect(fsWriteFileAdapter({ filepath, contents })).rejects.toThrow('Permission denied');
  });
});
