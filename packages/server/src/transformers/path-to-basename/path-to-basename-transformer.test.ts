import { pathToBasenameTransformer } from './path-to-basename-transformer';
import { AbsoluteFilePathStub } from '../../contracts/absolute-file-path/absolute-file-path.stub';

describe('pathToBasenameTransformer', () => {
  it('VALID: extracts filename from absolute path', () => {
    const filepath = AbsoluteFilePathStub({
      value: '/home/user/project/src/file.ts',
    });

    const result = pathToBasenameTransformer({ filepath });

    expect(result).toBe('file.ts');
  });

  it('VALID: extracts filename with multiple dots', () => {
    const filepath = AbsoluteFilePathStub({
      value: '/path/to/file.test.ts',
    });

    const result = pathToBasenameTransformer({ filepath });

    expect(result).toBe('file.test.ts');
  });

  it('VALID: handles filename with no path', () => {
    const filepath = AbsoluteFilePathStub({ value: 'standalone.ts' });

    const result = pathToBasenameTransformer({ filepath });

    expect(result).toBe('standalone.ts');
  });

  it('VALID: handles deeply nested path', () => {
    const filepath = AbsoluteFilePathStub({
      value: '/a/b/c/d/e/f/file.proxy.ts',
    });

    const result = pathToBasenameTransformer({ filepath });

    expect(result).toBe('file.proxy.ts');
  });
});
