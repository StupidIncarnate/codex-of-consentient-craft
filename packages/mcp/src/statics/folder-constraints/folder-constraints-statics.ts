/**
 * PURPOSE: Maps folder types to their constraint markdown filenames
 *
 * USAGE:
 * import { folderConstraintsStatics } from './statics/folder-constraints/folder-constraints-statics';
 * const filename = folderConstraintsStatics.brokers;
 * // Returns 'brokers-constraints.md'
 */
export const folderConstraintsStatics = {
  adapters: 'adapters-constraints.md',
  bindings: 'bindings-constraints.md',
  brokers: 'brokers-constraints.md',
  contracts: 'contracts-constraints.md',
  errors: 'errors-constraints.md',
  flows: 'flows-constraints.md',
  guards: 'guards-constraints.md',
  middleware: 'middleware-constraints.md',
  responders: 'responders-constraints.md',
  state: 'state-constraints.md',
  statics: 'statics-constraints.md',
  startup: 'startup-constraints.md',
  transformers: 'transformers-constraints.md',
  widgets: 'widgets-constraints.md',
} as const;

export type FolderTypeWithConstraints = keyof typeof folderConstraintsStatics;
