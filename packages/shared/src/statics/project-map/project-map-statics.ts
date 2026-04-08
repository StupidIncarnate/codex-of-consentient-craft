/**
 * PURPOSE: Configuration constants for the project map codebase overview generation
 *
 * USAGE:
 * import { projectMapStatics } from './statics/project-map/project-map-statics';
 * projectMapStatics.maxDepth1Items; // 10
 *
 * WHEN-TO-USE: When generating the codebase map and needing depth thresholds or display limits
 */

export const projectMapStatics = {
  defaultFolderDepth: 1,
  depth0: 0,
  depth2: 2,
  header: '# Codebase Map',
  emptyLabel: '(empty)',
  rootPackageName: 'root',
  packagesDirName: 'packages',
  srcDirName: 'src',
  packageJsonName: 'package.json',
  descriptionSeparator: '—',
} as const;
