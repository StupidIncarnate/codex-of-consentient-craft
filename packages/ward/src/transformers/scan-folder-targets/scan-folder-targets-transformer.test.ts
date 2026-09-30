
import { CliArgStub } from '../../contracts/cli-arg/cli-arg.stub';
import { ProjectFolderStub } from '../../contracts/project-folder/project-folder.stub';
import { scanFolderTargetsTransformer } from './scan-folder-targets-transformer';

const rootPath = '/repo';
const projectFolder = ProjectFolderStub({ name: 'ward', path: '/repo/packages/ward' });

describe('scanFolderTargetsTransformer', () => {
  it('EMPTY: {no paths} => scans the whole package', () => {
    const result = scanFolderTargetsTransformer({ paths: [], projectFolder, rootPath });

    expect(result).toStrictEqual({ inScope: true, targets: [] });
  });

  it('VALID: {the package folder itself} => scans the whole package', () => {
    const result = scanFolderTargetsTransformer({
      paths: [CliArgStub({ value: 'packages/ward' })],
      projectFolder,
      rootPath,
    });

    expect(result).toStrictEqual({ inScope: true, targets: [] });
  });

  it('VALID: {package folder with ./ prefix and trailing slash} => scans the whole package', () => {
    const result = scanFolderTargetsTransformer({
      paths: [CliArgStub({ value: './packages/ward/' })],
      projectFolder,
      rootPath,
    });

    expect(result).toStrictEqual({ inScope: true, targets: [] });
  });

  it('VALID: {absolute package folder} => scans the whole package', () => {
    const result = scanFolderTargetsTransformer({
      paths: [CliArgStub({ value: '/repo/packages/ward' })],
      projectFolder,
      rootPath,
    });

    expect(result).toStrictEqual({ inScope: true, targets: [] });
  });

  it('VALID: {two files in the package, one in another} => targets the two, relative to the package', () => {
    const result = scanFolderTargetsTransformer({
      paths: [
        CliArgStub({ value: 'packages/ward/src/a.ts' }),
        CliArgStub({ value: 'packages/hooks/src/b.ts' }),
        CliArgStub({ value: '/repo/packages/ward/src/c.ts' }),
      ],
      projectFolder,
      rootPath,
    });

    expect(result).toStrictEqual({ inScope: true, targets: ['src/a.ts', 'src/c.ts'] });
  });

  it('VALID: {the folder and a file inside it} => the folder wins and scans the whole package', () => {
    const result = scanFolderTargetsTransformer({
      paths: [
        CliArgStub({ value: 'packages/ward/src/a.ts' }),
        CliArgStub({ value: 'packages/ward' }),
      ],
      projectFolder,
      rootPath,
    });

    expect(result).toStrictEqual({ inScope: true, targets: [] });
  });

  it('EDGE: {paths only in other packages, one sharing a name prefix} => out of scope', () => {
    const result = scanFolderTargetsTransformer({
      paths: [
        CliArgStub({ value: 'packages/hooks/src/b.ts' }),
        CliArgStub({ value: 'packages/ward-extra/src/c.ts' }),
      ],
      projectFolder,
      rootPath,
    });

    expect(result).toStrictEqual({ inScope: false, targets: [] });
  });
});
