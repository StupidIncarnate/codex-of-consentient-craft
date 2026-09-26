/**
 * PURPOSE: Entry point for @dungeonmaster/node/fs/promises, the async half of the fs gateway.
 * Every function here is our own wrapper; Node's raw `fs/promises` is never re-exported.
 *
 * USAGE:
 * import { readFile, readJsonFileIfExists, stat } from '@dungeonmaster/node/fs/promises';
 */

export { readFile } from './read-file';
export { readFileIfExists } from './read-file-if-exists';
export { readFileBytes } from './read-file-bytes';
export { readFileFromOffset } from './read-file-from-offset';
export { readJsonFile } from './read-json-file';
export { readJsonFileIfExists } from './read-json-file-if-exists';
export { readNonEmptyLines } from './read-non-empty-lines';
export { pathExists } from './path-exists';
export { stat } from './stat';
export type { FileStat } from './stat';
export { statIfExists } from './stat-if-exists';
export { diskFreeBytes } from './disk-free-bytes';
export { readdir } from './readdir';
export { readdirIfExists } from './readdir-if-exists';
export { readdirEntries } from './readdir-entries';
export type { DirEntry } from './readdir-entries';
export { readlink } from './readlink';
export { readlinkIfLink } from './readlink-if-link';
export { realpath } from './realpath';
export { isFsError } from '../is-fs-error';
export type { FsError } from '../is-fs-error';
export { FsErrorStub } from '../fs-error.stub';

export { writeFile } from './write-file';
export { writeFileAtomic } from './write-file-atomic';
export { writeFileExclusive } from './write-file-exclusive';
export { writeFileCreatingParent } from './write-file-creating-parent';
export { writeFileBytes } from './write-file-bytes';
export { writeFileFromBase64 } from './write-file-from-base64';
export { appendFile } from './append-file';
export { appendLinesCreatingParent } from './append-lines-creating-parent';
export { ensureDir } from './ensure-dir';
export { rm } from './rm';
export { rename } from './rename';
export { unlink } from './unlink';
export { unlinkIfExists } from './unlink-if-exists';
export { copyFile } from './copy-file';
export { copyDirContents } from './copy-dir-contents';
export { symlink } from './symlink';
