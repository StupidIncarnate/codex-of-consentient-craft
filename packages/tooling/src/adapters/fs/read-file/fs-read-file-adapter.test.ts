import { fsReadFileAdapter } from './fs-read-file-adapter';
import { fsReadFileAdapterProxy } from './fs-read-file-adapter.proxy';
import { AbsoluteFilePathStub } from '../../../contracts/absolute-file-path/absolute-file-path.stub';
import { SourceCodeStub } from '../../../contracts/source-code/source-code.stub';

describe('fsReadFileAdapter', () => {
  it('VALID: {filePath: "/file.ts"} => returns source code', async () => {
    const adapterProxy = fsReadFileAdapterProxy();
    const filePath = AbsoluteFilePathStub({ value: '/file.ts' });
    const sourceCode = SourceCodeStub({ value: 'const x = 1;' });

    adapterProxy.returns({ filePath, sourceCode });

    const result = await fsReadFileAdapter({ filePath });

    expect(result).toBe('const x = 1;');
  });

  it('VALID: {filePath: "/empty.ts"} => returns empty source code', async () => {
    const adapterProxy = fsReadFileAdapterProxy();
    const filePath = AbsoluteFilePathStub({ value: '/empty.ts' });
    const sourceCode = SourceCodeStub({ value: '' });

    adapterProxy.returns({ filePath, sourceCode });

    const result = await fsReadFileAdapter({ filePath });

    expect(result).toBe('');
  });

  it('ERROR: {filePath: "/missing.ts"} => throws file not found error', async () => {
    const adapterProxy = fsReadFileAdapterProxy();
    const filePath = AbsoluteFilePathStub({ value: '/missing.ts' });
    const error = new Error('ENOENT: no such file or directory');

    adapterProxy.throws({ filePath, error });

    await expect(fsReadFileAdapter({ filePath })).rejects.toThrow(
      'ENOENT: no such file or directory',
    );
  });
});
