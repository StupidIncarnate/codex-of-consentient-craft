import { pathToRelativeTransformer } from './path-to-relative-transformer';
import { AbsoluteFilePathStub } from '../../contracts/absolute-file-path/absolute-file-path.stub';

describe('pathToRelativeTransformer', () => {
  it('VALID: removes cwd from absolute path', () => {
    const currentCwd = process.cwd();
    const filepath = AbsoluteFilePathStub({
      value: `${currentCwd}/packages/mcp/src/file.ts`,
    });

    const result = pathToRelativeTransformer({ filepath });

    expect(result).toBe('packages/mcp/src/file.ts');
  });

  it('VALID: handles path that does not start with cwd', () => {
    const filepath = AbsoluteFilePathStub({ value: '/other/path/file.ts' });

    const result = pathToRelativeTransformer({ filepath });

    expect(result).toBe('/other/path/file.ts');
  });

  it('VALID: handles nested structure within current directory', () => {
    const currentCwd = process.cwd();
    const filepath = AbsoluteFilePathStub({
      value: `${currentCwd}/src/guards/is-valid.ts`,
    });

    const result = pathToRelativeTransformer({ filepath });

    expect(result).toBe('src/guards/is-valid.ts');
  });
});
