/**
 * PURPOSE: Entry point for @dungeonmaster/node/fs, the synchronous half of the fs gateway. Holds
 * the realm-safe error guard shared with fs/promises; the synchronous wrappers themselves are
 * added here by the agent that owns them.
 *
 * USAGE:
 * import { isFsError } from '@dungeonmaster/node/fs';
 */

export { isFsError } from './is-fs-error';
export type { FsError } from './is-fs-error';
export { FsErrorStub } from './fs-error.stub';

export { existsSync } from './exists-sync';
export { readFileSync } from './read-file-sync';
export { readFileSyncIfExists } from './read-file-sync-if-exists';
export { readJsonFileSync } from './read-json-file-sync';
export { readJsonFileSyncIfExists } from './read-json-file-sync-if-exists';
export { statSync } from './stat-sync';
export type { FsStat } from './stat-sync';
export { readdirSync } from './readdir-sync';
export { readdirEntriesSync } from './readdir-entries-sync';
export type { DirEntrySync } from './readdir-entries-sync';
export { writeFileSync } from './write-file-sync';
export { appendFileSync } from './append-file-sync';
export { ensureDirSync } from './ensure-dir-sync';
export { findUpSync } from './find-up-sync';
export { rmSync } from './rm-sync';
export { unlinkSync } from './unlink-sync';
export { symlinkSync } from './symlink-sync';
export { realpathSync } from './realpath-sync';
export { globSync } from './glob-sync';
export { walkFilesSync } from './walk-files-sync';
export type { WalkedFile } from './walk-files-sync';
export { openForAppendSync } from './open-for-append-sync';
export { closeSync } from './close-sync';
export { tailFile } from './tail-file';
export type { TailFileHandle } from './tail-file';
