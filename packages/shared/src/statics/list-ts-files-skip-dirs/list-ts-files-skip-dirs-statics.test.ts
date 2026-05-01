import { listTsFilesSkipDirsStatics } from './list-ts-files-skip-dirs-statics';

describe('listTsFilesSkipDirsStatics', () => {
  it('VALID: exported value => matches expected shape', () => {
    expect(listTsFilesSkipDirsStatics).toStrictEqual({
      skipDirNames: ['dist', 'node_modules', '.git', 'coverage', 'build', '.next', '.turbo'],
    });
  });
});
