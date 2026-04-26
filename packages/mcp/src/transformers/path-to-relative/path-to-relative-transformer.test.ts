import { pathToRelativeTransformer } from './path-to-relative-transformer';
import { PathSegmentStub } from '@dungeonmaster/shared/contracts';

describe('pathToRelativeTransformer', () => {
  it('VALID: removes cwd from absolute path', () => {
    const cwd = PathSegmentStub({ value: '/home/user/project' });
    const filepath = PathSegmentStub({
      value: '/home/user/project/packages/mcp/src/file.ts',
    });

    const result = pathToRelativeTransformer({ filepath, cwd });

    expect(result).toBe('packages/mcp/src/file.ts');
  });

  it('VALID: handles path that does not start with cwd', () => {
    const cwd = PathSegmentStub({ value: '/home/user/project' });
    const filepath = PathSegmentStub({ value: '/other/path/file.ts' });

    const result = pathToRelativeTransformer({ filepath, cwd });

    expect(result).toBe('/other/path/file.ts');
  });

  it('VALID: handles nested structure within current directory', () => {
    const cwd = PathSegmentStub({ value: '/home/user/project' });
    const filepath = PathSegmentStub({
      value: '/home/user/project/src/guards/is-valid.ts',
    });

    const result = pathToRelativeTransformer({ filepath, cwd });

    expect(result).toBe('src/guards/is-valid.ts');
  });
});
