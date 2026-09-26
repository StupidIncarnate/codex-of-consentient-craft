/**
 * PURPOSE: Caller-facing proxy surface for @dungeonmaster/node's wrapped modules. Empty until
 * a wrapped (non-pass-through) module needs a proxy a caller can import.
 *
 * USAGE:
 * import { existsSyncProxy } from '@dungeonmaster/node/testing';
 */
export { existsSyncProxy } from '../fs/exists-sync.proxy';
export { readFileSyncProxy } from '../fs/read-file-sync.proxy';
export { readFileSyncIfExistsProxy } from '../fs/read-file-sync-if-exists.proxy';
export { readJsonFileSyncProxy } from '../fs/read-json-file-sync.proxy';
export { readJsonFileSyncIfExistsProxy } from '../fs/read-json-file-sync-if-exists.proxy';
export { statSyncProxy } from '../fs/stat-sync.proxy';
export { readdirSyncProxy } from '../fs/readdir-sync.proxy';
export { readdirEntriesSyncProxy } from '../fs/readdir-entries-sync.proxy';
export { writeFileSyncProxy } from '../fs/write-file-sync.proxy';
export { appendFileSyncProxy } from '../fs/append-file-sync.proxy';
export { ensureDirSyncProxy } from '../fs/ensure-dir-sync.proxy';
export { findUpSyncProxy } from '../fs/find-up-sync.proxy';
export { rmSyncProxy } from '../fs/rm-sync.proxy';
export { unlinkSyncProxy } from '../fs/unlink-sync.proxy';
export { symlinkSyncProxy } from '../fs/symlink-sync.proxy';
export { realpathSyncProxy } from '../fs/realpath-sync.proxy';
export { globSyncProxy } from '../fs/glob-sync.proxy';
export { walkFilesSyncProxy } from '../fs/walk-files-sync.proxy';
export { openForAppendSyncProxy } from '../fs/open-for-append-sync.proxy';
export { closeSyncProxy } from '../fs/close-sync.proxy';
export { tailFileProxy } from '../fs/tail-file.proxy';

export { readFileProxy } from '../fs/promises/read-file.proxy';
export { readFileIfExistsProxy } from '../fs/promises/read-file-if-exists.proxy';
export { readFileBytesProxy } from '../fs/promises/read-file-bytes.proxy';
export { readFileFromOffsetProxy } from '../fs/promises/read-file-from-offset.proxy';
export { readJsonFileProxy } from '../fs/promises/read-json-file.proxy';
export { readJsonFileIfExistsProxy } from '../fs/promises/read-json-file-if-exists.proxy';
export { readNonEmptyLinesProxy } from '../fs/promises/read-non-empty-lines.proxy';
export { pathExistsProxy } from '../fs/promises/path-exists.proxy';
export { statProxy } from '../fs/promises/stat.proxy';
export { statIfExistsProxy } from '../fs/promises/stat-if-exists.proxy';
export { diskFreeBytesProxy } from '../fs/promises/disk-free-bytes.proxy';
export { readdirProxy } from '../fs/promises/readdir.proxy';
export { readdirIfExistsProxy } from '../fs/promises/readdir-if-exists.proxy';
export { readdirEntriesProxy } from '../fs/promises/readdir-entries.proxy';
export { readlinkProxy } from '../fs/promises/readlink.proxy';
export { readlinkIfLinkProxy } from '../fs/promises/readlink-if-link.proxy';
export { realpathProxy } from '../fs/promises/realpath.proxy';

export { writeFileProxy } from '../fs/promises/write-file.proxy';
export { writeFileAtomicProxy } from '../fs/promises/write-file-atomic.proxy';
export { writeFileExclusiveProxy } from '../fs/promises/write-file-exclusive.proxy';
export { writeFileCreatingParentProxy } from '../fs/promises/write-file-creating-parent.proxy';
export { writeFileBytesProxy } from '../fs/promises/write-file-bytes.proxy';
export { writeFileFromBase64Proxy } from '../fs/promises/write-file-from-base64.proxy';
export { appendFileProxy } from '../fs/promises/append-file.proxy';
export { appendLinesCreatingParentProxy } from '../fs/promises/append-lines-creating-parent.proxy';
export { ensureDirProxy } from '../fs/promises/ensure-dir.proxy';
export { rmProxy } from '../fs/promises/rm.proxy';
export { renameProxy } from '../fs/promises/rename.proxy';
export { unlinkProxy } from '../fs/promises/unlink.proxy';
export { unlinkIfExistsProxy } from '../fs/promises/unlink-if-exists.proxy';
export { copyFileProxy } from '../fs/promises/copy-file.proxy';
export { copyDirContentsProxy } from '../fs/promises/copy-dir-contents.proxy';
export { symlinkProxy } from '../fs/promises/symlink.proxy';

export { runProxy } from '../child_process/run.proxy';
export { streamProxy } from '../child_process/stream.proxy';
export { streamLinesProxy } from '../child_process/stream-lines.proxy';
export { spawnDetachedProxy } from '../child_process/spawn-detached.proxy';
export { spawnLongLivedProxy } from '../child_process/spawn-long-lived.proxy';
export { spawnLiveProxy } from '../child_process/spawn-live.proxy';
export { runFireAndForgetProxy } from '../child_process/run-fire-and-forget.proxy';

export { resolvePackageRootProxy } from '../module/resolve-package-root.proxy';
export { dynamicImportProxy } from '../module/dynamic-import.proxy';

export { isPortFreeProxy } from '../net/is-port-free.proxy';
export { freePortPairProxy } from '../net/free-port-pair.proxy';
export { unixSocketRequestProxy } from '../net/unix-socket-request.proxy';
export { unixSocketServeProxy } from '../net/unix-socket-serve.proxy';

export { questionProxy } from '../readline/question.proxy';
export { lineReaderProxy } from '../readline/line-reader.proxy';

export { fetchJsonProxy } from '../fetch/fetch-json.proxy';
export { fetchOkProxy } from '../fetch/fetch-ok.proxy';
export { fetchWithStatusProxy } from '../fetch/fetch-with-status.proxy';

export { readStdinToEndProxy } from '../process/read-stdin-to-end.proxy';
export { getEnvProxy } from '../process/get-env.proxy';
