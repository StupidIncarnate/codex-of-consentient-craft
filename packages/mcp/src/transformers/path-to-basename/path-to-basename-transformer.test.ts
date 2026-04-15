import { pathToBasenameTransformer } from './path-to-basename-transformer';
import { PathSegmentStub } from '@dungeonmaster/shared/contracts';

describe('pathToBasenameTransformer', () => {
  it('VALID: extracts filename from absolute path', () => {
    const filepath = PathSegmentStub({
      value: '/home/user/project/src/file.ts',
    });

    const result = pathToBasenameTransformer({ filepath });

    expect(result).toBe('file.ts');
  });

  it('VALID: extracts filename with multiple dots', () => {
    const filepath = PathSegmentStub({
      value: '/path/to/file.test.ts',
    });

    const result = pathToBasenameTransformer({ filepath });

    expect(result).toBe('file.test.ts');
  });

  it('VALID: handles filename with no path', () => {
    const filepath = PathSegmentStub({ value: 'standalone.ts' });

    const result = pathToBasenameTransformer({ filepath });

    expect(result).toBe('standalone.ts');
  });

  it('VALID: handles deeply nested path', () => {
    const filepath = PathSegmentStub({
      value: '/a/b/c/d/e/f/file.proxy.ts',
    });

    const result = pathToBasenameTransformer({ filepath });

    expect(result).toBe('file.proxy.ts');
  });
});
