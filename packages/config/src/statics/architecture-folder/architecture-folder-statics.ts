/**
 * PURPOSE: Defines all valid architecture folder types in the project structure
 *
 * USAGE:
 * import {architectureFolderStatics} from './architecture-folder-statics';
 * const folders = architectureFolderStatics.folders.all;
 * // Returns readonly array of all valid architecture folder names
 */

export const architectureFolderStatics = {
  folders: {
    all: [
      'contracts',
      'transformers',
      'errors',
      'flows',
      'adapters',
      'middleware',
      'brokers',
      'bindings',
      'state',
      'responders',
      'widgets',
      'startup',
      'assets',
      'migrations',
    ] as const,
  },
} as const;
