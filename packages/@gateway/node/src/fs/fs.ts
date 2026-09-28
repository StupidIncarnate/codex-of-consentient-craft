/**
 * PURPOSE: Entry point for #gateway/node/fs, the synchronous half of the fs gateway. Holds
 * the realm-safe error guard shared with fs/promises; the synchronous wrappers themselves are
 * added here by the agent that owns them.
 *
 * USAGE:
 * import { isFsError } from '#gateway/node/fs';
 */

export * from 'fs';
export { appendFileSync } from './append-file-sync/append-file-sync';
export { closeSync } from './close-sync/close-sync';
export { ensureDirSync } from './ensure-dir-sync/ensure-dir-sync';
export { existsSync } from './exists-sync/exists-sync';
export { findUpSync } from './find-up-sync/find-up-sync';
export { globSync } from './glob-sync/glob-sync';
export { isFsError } from './is-fs-error/is-fs-error';
export type { FsError } from './is-fs-error/fs-error';
export { openForAppendSync } from './open-for-append-sync/open-for-append-sync';
export { readFileBytesSync } from './read-file-bytes-sync/read-file-bytes-sync';
export { readFileSync } from './read-file-sync/read-file-sync';
export { readFileSyncIfExists } from './read-file-sync-if-exists/read-file-sync-if-exists';
export { readJsonFileSync } from './read-json-file-sync/read-json-file-sync';
export { readJsonFileSyncIfExists } from './read-json-file-sync-if-exists/read-json-file-sync-if-exists';
export { readdirEntriesSync } from './readdir-entries-sync/readdir-entries-sync';
export type { DirEntrySync } from './readdir-entries-sync/dir-entry-sync';
export { readdirSync } from './readdir-sync/readdir-sync';
export { realpathSync } from './realpath-sync/realpath-sync';
export { rmSync } from './rm-sync/rm-sync';
export { statSync } from './stat-sync/stat-sync';
export type { FsStat } from './stat-sync/fs-stat';
export { symlinkSync } from './symlink-sync/symlink-sync';
export { tailFile } from './tail-file/tail-file';
export type { TailFileHandle } from './tail-file/tail-file-handle';
export { unlinkSync } from './unlink-sync/unlink-sync';
export { walkFilesSync } from './walk-files-sync/walk-files-sync';
export type { WalkedFile } from './walk-files-sync/walked-file';
export { isWalkedFile } from './walk-files-sync/is-walked-file';
export { walkedFileSchema } from './walk-files-sync/walked-file-schema';
export { writeFileSync } from './write-file-sync/write-file-sync';
