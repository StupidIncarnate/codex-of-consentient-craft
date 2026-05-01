/**
 * PURPOSE: Configuration constants for the library headline renderer
 *
 * USAGE:
 * projectMapHeadlineLibraryStatics.subpathPrefix; // './'
 * projectMapHeadlineLibraryStatics.libraryExportsSectionHeader; // '## Library exports'
 *
 * WHEN-TO-USE: project-map-headline-library broker and its layer brokers
 */

export const projectMapHeadlineLibraryStatics = {
  subpathPrefixLength: 2,
  libraryExportsSectionHeader: '## Library exports',
  consumersSectionHeader: '## Consumers',
  noConsumersLine: '(0 consumer packages)',
  fileCountSuffix: 'files',
  staticsBarrelName: 'statics',
  noExportsLine: '(no barrel exports found)',
} as const;
