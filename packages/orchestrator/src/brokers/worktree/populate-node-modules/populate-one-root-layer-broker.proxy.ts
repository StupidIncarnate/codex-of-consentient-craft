import { CpNotInstalledErrorProxy } from '#gateway/bin/cp/cp-run/cp-not-installed.error.proxy';
import { registerMock, requireActual } from '@dungeonmaster/testing/register-mock';
import {
  AbsoluteFilePathStub,
  type AbsoluteFilePath,
  type FilePath,
} from '@dungeonmaster/shared/contracts';
import { locationsNodeModulesPathFindBrokerProxy } from '@dungeonmaster/shared/testing';
import { cpRunProxy } from '#gateway/bin/cp/cp-run/cp-run.proxy';
import type { DirEntrySync, FsError } from '#gateway/node/fs';
import { readdirEntriesSyncProxy } from '#gateway/node/fs/readdir-entries-sync/readdir-entries-sync.proxy';
import { pathExistsProxy } from '#gateway/node/fs__promises/path-exists/path-exists.proxy';
import { ensureDirProxy } from '#gateway/node/fs__promises/ensure-dir/ensure-dir.proxy';
import { readlinkIfLinkProxy } from '#gateway/node/fs__promises/readlink-if-link/readlink-if-link.proxy';
import { symlinkProxy } from '#gateway/node/fs__promises/symlink/symlink.proxy';
import { join } from '#gateway/node/path';

// Every copy this layer makes is a hardlink copy (`cp -al <sources...> <destination>`), with as many
// sources as the root holds entries, so the address is that one flag rather than an exact argv.
const isHardlinkCopy = (args: readonly unknown[]): boolean => args[0] === '-al';

// A recorded cp call is `[{ command, args, cwd }]`; the tests read back only its argv.
const copyArgsOf = (call: readonly unknown[]): unknown => {
  const [spawned] = call;
  return typeof spawned === 'object' && spawned !== null && 'args' in spawned
    ? spawned.args
    : undefined;
};

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
  setupSymlinkSucceeds: (params: { target: FilePath; path: FilePath }) => void;
  setupCopySucceeds: () => void;
  setupCopyFails: (params: { output: string }) => void;
  getAllSymlinks: () => readonly { target: unknown; linkPath: unknown }[];
  getAllCopyArgs: () => readonly unknown[];
} => {
  CpNotInstalledErrorProxy();
  // The layer runs REAL from this proxy's point of view — it is not an I/O boundary — so the
  // I/O it eventually reaches (readdir/readlink/symlink/mkdir/access) is what actually gets staged
  // here.
  const readdirProxy = readdirEntriesSyncProxy();
  const ensureDirHandle = ensureDirProxy();
  const linkProxy = symlinkProxy();
  const readlinkProxy = readlinkIfLinkProxy();
  // Every (target, path) pair a test staged: `getAllSymlinks` reads back the calls at exactly those
  // addresses, so an unstaged link the broker attempts rejects rather than going unseen.
  const stagedLinks: { target: FilePath; path: FilePath }[] = [];
  const isAccessibleProxy = pathExistsProxy();
  const copyChild = cpRunProxy();
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
      isAccessibleProxy.present({ path: `${targetRoot}/node_modules` });
      readdirProxy.returns({
        path: AbsoluteFilePathStub({ value: `${targetRoot}/node_modules` }),
        entries: entries.map(dirEntryFrom),
      });
    },

    setupReadlinkTarget: ({ linkPath, target }: { linkPath: FilePath; target: string }): void => {
      readlinkProxy.returns({ path: linkPath, target });
    },
    setupTargetReady: ({
      targetRoot,
      scopeNames = [],
    }: {
      targetRoot: AbsoluteFilePath;
      scopeNames?: readonly string[];
    }): void => {
      const targetNodeModules = `${targetRoot}/node_modules`;
      // Every root's done-check asks whether its TARGET node_modules is already there; a fresh
      // worktree answers "not there". Stage setupTargetNodeModulesOnDisk AFTER this call to describe
      // a target that is.
      isAccessibleProxy.missing({ path: targetNodeModules });
      ensureDirHandle.succeeds({ path: targetNodeModules });
      scopeNames.forEach((name) => {
        ensureDirHandle.succeeds({ path: `${targetNodeModules}/${name}` });
      });
    },
    setupMkdirThrows: ({ filepath, error }: { filepath: FilePath; error: FsError }): void => {
      // The done-check probes the target node_modules before any mkdir runs, and a directory whose
      // creation fails was not there.
      isAccessibleProxy.missing({ path: filepath });
      ensureDirHandle.rejects({ path: filepath, error });
    },
    setupSymlinkSucceeds: ({ target, path }: { target: FilePath; path: FilePath }): void => {
      stagedLinks.push({ target, path });
      linkProxy.succeeds({ target, path });
    },
    setupCopySucceeds: (): void => {
      copyChild.returnsMatchingArgs({ args: isHardlinkCopy, exitCode: 0, output: '' });
    },
    setupCopyFails: ({ output }: { output: string }): void => {
      copyChild.returnsMatchingArgs({ args: isHardlinkCopy, exitCode: 1, output });
    },
    getAllSymlinks: (): readonly { target: unknown; linkPath: unknown }[] =>
      stagedLinks.flatMap(({ target, path }) =>
        linkProxy
          .getCallsFor({ target, path })
          .map((call) => ({ target: call[0], linkPath: call[1] })),
      ),
    getAllCopyArgs: (): readonly unknown[] =>
      copyChild.getCallsFor({ args: isHardlinkCopy }).map(copyArgsOf),
  };
};
