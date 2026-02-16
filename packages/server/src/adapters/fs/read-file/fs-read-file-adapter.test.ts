import { fsReadFileAdapter } from './fs-read-file-adapter';
import { fsReadFileAdapterProxy } from './fs-read-file-adapter.proxy';
import { FilePathStub } from '../../../contracts/file-path/file-path.stub';
import { FileContentsStub } from '../../../contracts/file-contents/file-contents.stub';

describe('fsReadFileAdapter', () => {
  it('VALID: {filepath: "/path/to/file.ts"} => returns file contents', async () => {
    const adapterProxy = fsReadFileAdapterProxy();
    const filepath = FilePathStub({ value: '/path/to/file.ts' });
    const expectedContents = FileContentsStub({
      value: 'export const example = "test";',
    });

    adapterProxy.returns({ filepath, contents: expectedContents });

    const result = await fsReadFileAdapter({ filepath });

    expect(result).toStrictEqual(expectedContents);
  });

  it('ERROR: {filepath: "/nonexistent"} => throws error', async () => {
    const adapterProxy = fsReadFileAdapterProxy();
    const filepath = FilePathStub({ value: '/nonexistent' });
    const expectedError = new Error('File not found');

    adapterProxy.throws({ filepath, error: expectedError });

    await expect(fsReadFileAdapter({ filepath })).rejects.toThrow('File not found');
  });
});
