/**
 * PURPOSE: Lists folder types whose exports are callable functions (vs Zod schemas, as-const objects, or class definitions)
 *
 * USAGE:
 * import { functionExportingFoldersStatics } from './function-exporting-folders-statics';
 * for (const folderType of functionExportingFoldersStatics.names) { ... }
 */
export const functionExportingFoldersStatics = {
  names: [
    'adapters',
    'bindings',
    'brokers',
    'flows',
    'guards',
    'middleware',
    'responders',
    'state',
    'transformers',
    'widgets',
  ],
  startupPathSegment: '/startup/',
  startupFolderType: 'startup',
} as const;
