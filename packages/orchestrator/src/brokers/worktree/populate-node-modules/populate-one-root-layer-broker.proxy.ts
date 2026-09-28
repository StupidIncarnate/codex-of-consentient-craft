import { registerMock, requireActual } from '@dungeonmaster/testing/register-mock';
import {
  AbsoluteFilePathStub,
  FilePathStub,
  type AbsoluteFilePath,
  type FilePath,
} from '@dungeonmaster/shared/contracts';
import { locationsNodeModulesPathFindBrokerProxy } from '@dungeonmaster/shared/testing';
import { RunNotFoundErrorProxy } from '#gateway/node/child_process/run-not-found.error.proxy';
import { runProxy } from '#gateway/node/child_process/run/run.proxy';
import type { DirEntrySync, FsError } from '#gateway/node/fs';
import { readdirEntriesSyncProxy } from '#gateway/node/fs/readdir-entries-sync/readdir-entries-sync.proxy';
import { ensureDirProxy } from '#gateway/node/fs__promises/ensure-dir/ensure-dir.proxy';
import { join } from '#gateway/node/path';

import { fsIsAccessibleAdapterProxy } from '../../../adapters/fs/is-accessible/fs-is-accessible-adapter.proxy';
import { fsReadlinkAdapterProxy } from '../../../adapters/fs/readlink/fs-readlink-adapter.proxy';
import { fsSymlinkAdapterProxy } from '../../../adapters/fs/symlink/fs-symlink-adapter.proxy';

const COPY_COMMAND = 'cp';

// The gateway's readdirEntriesSync collapses a Dirent down to {name, kind}; this proxy's own
// callers still describe entries as {isDir, isSymlink} (matching the shape their sibling
// walk-symlinks/seed-dist proxies use), so this is the one place that reduces to ONE discriminant.
const dirEntryFrom = ({
  name,
  isDir,
  isSymlink,
}: {
  name: string;
  isDir: boolean;
  isSymlink: boolean;
}): DirEntrySync => ({
  name,
  kind: isSymlink ? 'symlink' : isDir ? 'directory' : 'file',
});

export const populateOneRootLayerBrokerProxy = (): {
  setupDirectoryEntries: (params: {
    dirPath: AbsoluteFilePath;
    entries: { name: string; isDir: boolean; isSymlink: boolean }[];
  }) => void;
  setupTargetNodeModulesOnDisk: (params: {
    targetRoot: AbsoluteFilePath;
    entries: { name: string; isDir: boolean; isSymlink: boolean }[];
  }) => void;
  setupReadlinkTarget: (params: { linkPath: FilePath; target: string }) => void;
  // Stages the ROOT `ensureDir(targetRoot/node_modules)` call every "not already populated" pass
  // makes, plus one per named npm scope directory beneath it — the exact set this layer computes,
  // addressed by their real values rather than an unaddressed catch-all.
  setupTargetReady: (params: {
    targetRoot: AbsoluteFilePath;
    scopeNames?: readonly string[];
  }) => void;
  setupMkdirThrows: (params: { filepath: FilePath; error: FsError }) => void;
  setupSymlinkSucceeds: (params: { target: FilePath }) => void;
  setupCopySucceeds: () => void;
  setupCopyFails: (params: { output: string }) => void;
  getAllSymlinks: () => readonly { target: unknown; linkPath: unknown }[];
  getAllCopyArgs: () => readonly unknown[];
} => {
  // The layer runs REAL from this proxy's point of view — it is not an I/O boundary — so the
  // I/O it eventually reaches (readdir/readlink/symlink/mkdir/access) is what actually gets staged
  // here.
  const readdirProxy = readdirEntriesSyncProxy();
  const ensureDirHandle = ensureDirProxy();
  const symlinkProxy = fsSymlinkAdapterProxy();
  const readlinkProxy = fsReadlinkAdapterProxy();
  const isAccessibleProxy = fsIsAccessibleAdapterProxy();
  // Every root's done-check asks whether its TARGET node_modules is already there. "Not there" is
  // the honest default for a fresh worktree, so an undescribed target mirrors; a target described
  // by setupTargetNodeModulesOnDisk below outranks this catch-all.
  isAccessibleProxy.defaultsToNotFound();
  const run = runProxy();
  // Created but unstaged: RunNotFoundError is a plain class with nothing to mock — composing its
  // proxy satisfies enforce-proxy-child-creation for the broker's own `instanceof` import.
  RunNotFoundErrorProxy();
  // `join` computes many intermediate scope/child paths purely from string arithmetic, and the
  // tests below assert on the REAL result (via getAllSymlinks/getAllCopyArgs), so the default stays
  // a real passthrough rather than staging every tuple individually.
  const realPath = requireActual<{ join: typeof join }>({ module: 'path' });
  registerMock({ fn: join })
    .calledWith([])
    .implement((...segments: never[]) => realPath.join(...segments));
  // Wired to satisfy enforce-proxy-child-creation and left UNADDRESSED: the locations resolver
  // stages nothing of its own, so every joined path used to stage the adapters above must match
  // Node's actual path.join output byte-for-byte.
  locationsNodeModulesPathFindBrokerProxy();

  return {
    setupDirectoryEntries: ({
      dirPath,
      entries,
    }: {
      dirPath: AbsoluteFilePath;
      entries: { name: string; isDir: boolean; isSymlink: boolean }[];
    }): void => {
      readdirProxy.returns({
        path: dirPath,
        entries: entries.map(dirEntryFrom),
      });
    },

    // Describes what is ALREADY on disk at the target root's node_modules. The done-check needs
    // both halves — reachable AND non-empty — so passing `entries: []` describes the directory a
    // previous attempt created and then died before filling, which is NOT done.
    setupTargetNodeModulesOnDisk: ({
      targetRoot,
      entries,
    }: {
      targetRoot: AbsoluteFilePath;
      entries: { name: string; isDir: boolean; isSymlink: boolean }[];
    }): void => {
      isAccessibleProxy.resolves({
        filePath: FilePathStub({ value: `${targetRoot}/node_modules` }),
      });
      readdirProxy.returns({
        path: AbsoluteFilePathStub({ value: `${targetRoot}/node_modules` }),
        entries: entries.map(dirEntryFrom),
      });
    },

    setupReadlinkTarget: ({ linkPath, target }: { linkPath: FilePath; target: string }): void => {
      readlinkProxy.returns({ linkPath, target });
    },
    setupTargetReady: ({
      targetRoot,
      scopeNames = [],
    }: {
      targetRoot: AbsoluteFilePath;
      scopeNames?: readonly string[];
    }): void => {
      const targetNodeModules = `${targetRoot}/node_modules`;
      ensureDirHandle.succeeds({ path: targetNodeModules });
      scopeNames.forEach((name) => {
        ensureDirHandle.succeeds({ path: `${targetNodeModules}/${name}` });
      });
    },
    setupMkdirThrows: ({ filepath, error }: { filepath: FilePath; error: FsError }): void => {
      ensureDirHandle.rejects({ path: filepath, error });
    },
    setupSymlinkSucceeds: ({ target }: { target: FilePath }): void => {
      symlinkProxy.succeeds({ target });
    },
    setupCopySucceeds: (): void => {
      run.setupSuccess({ command: COPY_COMMAND, exitCode: 0, stdout: '', stderr: '' });
    },
    setupCopyFails: ({ output }: { output: string }): void => {
      run.setupSuccess({ command: COPY_COMMAND, exitCode: 1, stdout: '', stderr: output });
    },
    getAllSymlinks: (): readonly { target: unknown; linkPath: unknown }[] =>
      symlinkProxy.getAllSymlinks(),
    getAllCopyArgs: (): readonly unknown[] => run.getCallsFor({ command: COPY_COMMAND }),
  };
};
