import { projectMapHeadlineLibraryStatics } from './project-map-headline-library-statics';

describe('projectMapHeadlineLibraryStatics', () => {
  it('VALID: statics => match expected shape', () => {
    expect(projectMapHeadlineLibraryStatics).toStrictEqual({
      subpathPrefixLength: 2,
      libraryExportsSectionHeader: '## Library exports',
      consumersSectionHeader: '## Consumers',
      noConsumersLine: '(0 consumer packages)',
      fileCountSuffix: 'files',
      staticsBarrelName: 'statics',
      noExportsLine: '(no barrel exports found)',
    });
  });
});
