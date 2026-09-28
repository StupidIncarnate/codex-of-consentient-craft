import { censusPackageOfFileTransformer } from './census-package-of-file-transformer';
import { CensusPathStub } from '../../contracts/census-path/census-path.stub';
import { CensusPackageStub } from '../../contracts/census-package/census-package.stub';

describe('censusPackageOfFileTransformer', () => {
  const api = CensusPackageStub({ name: '@acme/api' as never, dir: 'packages/api' as never });
  const node = CensusPackageStub({
    name: '@acme/node' as never,
    dir: 'packages/@gateway/node' as never,
  });

  it('VALID: {a file under a package dir} => that package', () => {
    const result = censusPackageOfFileTransformer({
      file: CensusPathStub({ value: 'packages/api/src/x.ts' }),
      packages: [api, node],
    });

    expect(result).toStrictEqual({ name: '@acme/api', dir: 'packages/api' });
  });

  it('VALID: {a gateway file} => the gateway package', () => {
    const result = censusPackageOfFileTransformer({
      file: CensusPathStub({ value: 'packages/@gateway/node/src/fs/fs.ts' }),
      packages: [api, node],
    });

    expect(result).toStrictEqual({ name: '@acme/node', dir: 'packages/@gateway/node' });
  });

  it('VALID: {nested package dirs} => the longest dir wins', () => {
    const inner = CensusPackageStub({
      name: '@acme/inner' as never,
      dir: 'packages/api/inner' as never,
    });

    const result = censusPackageOfFileTransformer({
      file: CensusPathStub({ value: 'packages/api/inner/src/x.ts' }),
      packages: [api, inner],
    });

    expect(result).toStrictEqual({ name: '@acme/inner', dir: 'packages/api/inner' });
  });

  it('EMPTY: {a file no package owns} => null', () => {
    const result = censusPackageOfFileTransformer({
      file: CensusPathStub({ value: 'scripts/x.ts' }),
      packages: [api, node],
    });

    expect(result).toBe(null);
  });

  it('EDGE: {a dir that only shares a name prefix} => null', () => {
    const result = censusPackageOfFileTransformer({
      file: CensusPathStub({ value: 'packages/api-extra/src/x.ts' }),
      packages: [api],
    });

    expect(result).toBe(null);
  });
});
