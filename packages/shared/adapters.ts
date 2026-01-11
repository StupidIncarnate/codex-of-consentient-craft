/**
 * PURPOSE: Barrel export for shared adapters
 *
 * USAGE:
 * import { fsAccessAdapter, pathJoinAdapter } from '@dungeonmaster/shared/adapters';
 */

// Subpath export entry for @dungeonmaster/shared/adapters

// File System Adapters
export * from './src/adapters/fs/access/fs-access-adapter';
export * from './src/adapters/fs/exists-sync/fs-exists-sync-adapter';
export * from './src/adapters/fs/mkdir/fs-mkdir-adapter';

// Path Adapters
export * from './src/adapters/path/dirname/path-dirname-adapter';
export * from './src/adapters/path/join/path-join-adapter';

// Module Adapters
export * from './src/adapters/runtime/dynamic-import/runtime-dynamic-import-adapter';
