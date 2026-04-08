import { projectMapStatics } from './project-map-statics';

describe('projectMapStatics', () => {
  it('VALID: exported value => matches expected shape', () => {
    expect(projectMapStatics).toStrictEqual({
      maxDepth1Items: 10,
      defaultFolderDepth: 1,
      depth0: 0,
      depth2: 2,
      header: '# Codebase Map',
      emptyLabel: '(empty)',
      rootPackageName: 'root',
      packagesDirName: 'packages',
      srcDirName: 'src',
    });
  });
});
