import { filePathToCwdRelativeTransformer } from './file-path-to-cwd-relative-transformer';
import { PathSegmentStub } from '@dungeonmaster/shared/contracts';

describe('filePathToCwdRelativeTransformer', () => {
  it('VALID: {filename inside cwd} => returns relative path', () => {
    const result = filePathToCwdRelativeTransformer({
      filename: '/repo/src/foo.ts',
      cwd: '/repo',
    });

    expect(result).toStrictEqual(PathSegmentStub({ value: 'src/foo.ts' }));
  });

  it('VALID: {filename matches cwd exactly} => returns empty string', () => {
    const result = filePathToCwdRelativeTransformer({
      filename: '/repo',
      cwd: '/repo',
    });

    expect(result).toStrictEqual(PathSegmentStub({ value: '' }));
  });

  it('VALID: {filename outside cwd} => returns original filename', () => {
    const result = filePathToCwdRelativeTransformer({
      filename: '/other/path/foo.ts',
      cwd: '/repo',
    });

    expect(result).toStrictEqual(PathSegmentStub({ value: '/other/path/foo.ts' }));
  });

  it('VALID: {cwd is empty} => returns original filename', () => {
    const result = filePathToCwdRelativeTransformer({
      filename: '/repo/src/foo.ts',
      cwd: '',
    });

    expect(result).toStrictEqual(PathSegmentStub({ value: '/repo/src/foo.ts' }));
  });

  it('VALID: {filename equals cwd with trailing slash} => strips leading slash', () => {
    const result = filePathToCwdRelativeTransformer({
      filename: '/repo/foo.ts',
      cwd: '/repo',
    });

    expect(result).toStrictEqual(PathSegmentStub({ value: 'foo.ts' }));
  });
});
