import { pathToRelativeTransformer } from './path-to-relative-transformer';
import { AbsoluteFilePathStub } from '../../contracts/absolute-file-path/absolute-file-path.stub';

describe('pathToRelativeTransformer', () => {
  const originalCwd = process.cwd();

  afterEach(() => {
    // Restore original cwd
    process.chdir(originalCwd);
  });

  it('VALID: removes cwd from absolute path', () => {
    process.chdir('/home/user/project');
    const filepath = AbsoluteFilePathStub({
      value: '/home/user/project/packages/mcp/src/file.ts',
    });

    const result = pathToRelativeTransformer({ filepath });

    expect(result).toBe('packages/mcp/src/file.ts');
  });

  it('VALID: handles path that does not start with cwd', () => {
    process.chdir('/home/user/project');
    const filepath = AbsoluteFilePathStub({ value: '/other/path/file.ts' });

    const result = pathToRelativeTransformer({ filepath });

    expect(result).toBe('/other/path/file.ts');
  });

  it('VALID: handles nested project structure', () => {
    process.chdir('/home/user/projects/my-app');
    const filepath = AbsoluteFilePathStub({
      value: '/home/user/projects/my-app/src/guards/is-valid.ts',
    });

    const result = pathToRelativeTransformer({ filepath });

    expect(result).toBe('src/guards/is-valid.ts');
  });
});
