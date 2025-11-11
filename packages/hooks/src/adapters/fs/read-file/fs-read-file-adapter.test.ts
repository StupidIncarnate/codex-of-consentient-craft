import { fsReadFileAdapter } from './fs-read-file-adapter';
import { fsReadFileAdapterProxy } from './fs-read-file-adapter.proxy';
import { FilePathStub } from '../../../contracts/file-path/file-path.stub';
import { FileContentsStub } from '../../../contracts/file-contents/file-contents.stub';

describe('fsReadFileAdapter', () => {
  it('VALID: {filePath} => reads file contents', async () => {
    const proxy = fsReadFileAdapterProxy();
    const filePath = FilePathStub({ value: '/test/file.ts' });
    const contents = FileContentsStub({ value: 'test content' });
    proxy.returns({ contents });

    const result = await fsReadFileAdapter({ filePath });

    expect(result).toStrictEqual(contents);
  });
});
