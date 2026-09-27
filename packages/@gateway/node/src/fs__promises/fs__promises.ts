/**
 * PURPOSE: Entry point for #gateway/node/fs__promises, the async half of the fs gateway.
 * Every function here is our own wrapper; Node's raw `fs/promises` is never re-exported.
 *
 * USAGE:
 * import { readFile, readJsonFileIfExists, stat } from '#gateway/node/fs__promises';
 */

export * from 'fs/promises';
export { appendFile } from './append-file/append-file';
export { appendLinesCreatingParent } from './append-lines-creating-parent/append-lines-creating-parent';
export { copyDirContents } from './copy-dir-contents/copy-dir-contents';
export { copyDirContentsEntriesRecurse } from './copy-dir-contents-entries-recurse/copy-dir-contents-entries-recurse';
export { copyFile } from './copy-file/copy-file';
export { diskFreeBytes } from './disk-free-bytes/disk-free-bytes';
export { ensureDir } from './ensure-dir/ensure-dir';
export { pathExists } from './path-exists/path-exists';
export { readFile } from './read-file/read-file';
export { readFileBytes } from './read-file-bytes/read-file-bytes';
export { readFileFromOffset } from './read-file-from-offset/read-file-from-offset';
export { readFileIfExists } from './read-file-if-exists/read-file-if-exists';
export { readJsonFile } from './read-json-file/read-json-file';
export { readJsonFileIfExists } from './read-json-file-if-exists/read-json-file-if-exists';
export { readNonEmptyLines } from './read-non-empty-lines/read-non-empty-lines';
export { readdir } from './readdir/readdir';
export { readdirEntries } from './readdir-entries/readdir-entries';
export type { DirEntry } from './readdir-entries/dir-entry';
export { readdirIfExists } from './readdir-if-exists/readdir-if-exists';
export { readlink } from './readlink/readlink';
export { readlinkIfLink } from './readlink-if-link/readlink-if-link';
export { realpath } from './realpath/realpath';
export { rename } from './rename/rename';
export { rm } from './rm/rm';
export { stat } from './stat/stat';
export type { FileStat } from './stat/file-stat';
export { statIfExists } from './stat-if-exists/stat-if-exists';
export { symlink } from './symlink/symlink';
export { unlink } from './unlink/unlink';
export { unlinkIfExists } from './unlink-if-exists/unlink-if-exists';
export { writeFile } from './write-file/write-file';
export { writeFileAtomic } from './write-file-atomic/write-file-atomic';
export { writeFileBytes } from './write-file-bytes/write-file-bytes';
export { writeFileCreatingParent } from './write-file-creating-parent/write-file-creating-parent';
export { writeFileExclusive } from './write-file-exclusive/write-file-exclusive';
export { writeFileFromBase64 } from './write-file-from-base64/write-file-from-base64';
