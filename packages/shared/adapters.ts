/**
 * PURPOSE: Barrel export for shared adapters
 *
 * USAGE:
 * import { fsAccessAdapter, pathJoinAdapter } from '@dungeonmaster/shared/adapters';
 */

// Subpath export entry for @dungeonmaster/shared/adapters

// File System Adapters
export * from './src/adapters/fs/access/fs-access-adapter';
export * from './src/adapters/fs/access/fs-access-adapter.proxy';

// Path Adapters
export * from './src/adapters/path/dirname/path-dirname-adapter';
export * from './src/adapters/path/dirname/path-dirname-adapter.proxy';
export * from './src/adapters/path/join/path-join-adapter';
export * from './src/adapters/path/join/path-join-adapter.proxy';
