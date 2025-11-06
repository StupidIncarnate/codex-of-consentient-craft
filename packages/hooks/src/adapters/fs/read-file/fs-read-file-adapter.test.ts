import { fsReadFileAdapter } from './fs-read-file-adapter';
import { fsReadFileAdapterProxy } from './fs-read-file-adapter.proxy';
import { filePathStub } from '../../../../contracts/file-path/file-path.stub';
import { fileContentsStub } from '../../../../contracts/file-contents/file-contents.stub';

describe('fsReadFileAdapter', () => {
  it('should read file contents', async () => {
    fsReadFileAdapterProxy.mockResolvedValue(fileContentsStub);

    const result = await fsReadFileAdapter({ filePath: filePathStub });

    expect(result).toBe(fileContentsStub);
    expect(fsReadFileAdapterProxy).toHaveBeenCalledWith({ filePath: filePathStub });
  });
});
