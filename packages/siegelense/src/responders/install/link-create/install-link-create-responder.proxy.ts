import { mkdir, symlink } from 'fs/promises';
import {
  fsMkdirAdapterProxy,
  fsExistsSyncAdapterProxy,
  pathJoinAdapterProxy,
} from '@dungeonmaster/shared/testing';
import { AbsoluteFilePathStub, FilePathStub } from '@dungeonmaster/shared/contracts';

import { locationsRootPathFindBrokerProxy } from '../../../brokers/locations/root-path-find/locations-root-path-find-broker.proxy';
import { fsReadlinkAdapterProxy } from '../../../adapters/fs/readlink/fs-readlink-adapter.proxy';
import { fsSymlinkAdapterProxy } from '../../../adapters/fs/symlink/fs-symlink-adapter.proxy';
import { fsUnlinkAdapterProxy } from '../../../adapters/fs/unlink/fs-unlink-adapter.proxy';
import { InstallLinkCreateResponder } from './install-link-create-responder';

// Every caller in this file exercises targetProjectRoot: '/project', with the siegelense root
// resolved through locationsRootPathFindBrokerProxy to TARGET_DIR_VALUE (never through
// context.dungeonmasterRoot — the responder no longer reads that field), so every setup method
// targets the same pair.
const TARGET_DIR_VALUE = '/home/user/.dungeonmaster/siegelense';
const LINK_PATH_VALUE = '/project/.siegelense';

const targetDirAbs = AbsoluteFilePathStub({ value: TARGET_DIR_VALUE });
const targetDirFp = FilePathStub({ value: TARGET_DIR_VALUE });
const linkPathAbs = AbsoluteFilePathStub({ value: LINK_PATH_VALUE });
const linkPathFp = FilePathStub({ value: LINK_PATH_VALUE });

export const InstallLinkCreateResponderProxy = (): {
  callResponder: typeof InstallLinkCreateResponder;
  setupNoLink: () => void;
  setupCorrectLink: () => void;
  setupWrongTarget: (params: { wrongTarget: string }) => void;
  getSymlinkCalls: () => readonly { targetPath: unknown; linkPath: unknown; type: unknown }[];
  getReadlinkCalls: () => readonly unknown[];
  getUnlinkedPaths: () => readonly unknown[];
  assertMkdirCalledBeforeSymlink: () => boolean;
} => {
  const rootPathProxy = locationsRootPathFindBrokerProxy();
  const pathJoinProxy = pathJoinAdapterProxy();
  const mkdirProxy = fsMkdirAdapterProxy();
  const existsProxy = fsExistsSyncAdapterProxy();
  const symlinkProxy = fsSymlinkAdapterProxy();
  const readlinkProxy = fsReadlinkAdapterProxy();
  const unlinkProxy = fsUnlinkAdapterProxy();

  // The responder resolves targetDir (locationsRootPathFindBroker's own pathJoin, staged inside
  // rootPathProxy.setupRootPath) BEFORE it resolves linkPath (this file's own pathJoin) —
  // pathJoinAdapterProxy's `returns()` is call-order scoped, so registration order here has to
  // match that execution order.
  const setupTargetDir = (): void => {
    rootPathProxy.setupRootPath({
      homeDir: '/home/user',
      homePath: FilePathStub({ value: '/home/user/.dungeonmaster' }),
      rootPath: targetDirFp,
    });
  };

  return {
    callResponder: InstallLinkCreateResponder,

    // Neither the target dir nor the link exist yet — the fresh-install case.
    setupNoLink: (): void => {
      setupTargetDir();
      pathJoinProxy.returns({ result: linkPathFp });
      mkdirProxy.succeeds({ filepath: targetDirFp });
      existsProxy.returns({ filePath: linkPathFp, result: false });
      symlinkProxy.succeeds({ targetPath: targetDirAbs, linkPath: linkPathAbs });
    },

    // The link exists and already reads back the right target — the no-op case.
    setupCorrectLink: (): void => {
      setupTargetDir();
      pathJoinProxy.returns({ result: linkPathFp });
      mkdirProxy.succeeds({ filepath: targetDirFp });
      existsProxy.returns({ filePath: linkPathFp, result: true });
      readlinkProxy.resolves({ linkPath: linkPathAbs, resolvedTarget: targetDirAbs });
    },

    // The link exists but stores a different target — a leftover from another checkout.
    setupWrongTarget: ({ wrongTarget }: { wrongTarget: string }): void => {
      setupTargetDir();
      pathJoinProxy.returns({ result: linkPathFp });
      mkdirProxy.succeeds({ filepath: targetDirFp });
      existsProxy.returns({ filePath: linkPathFp, result: true });
      readlinkProxy.resolves({ linkPath: linkPathAbs, resolvedTarget: wrongTarget });
      unlinkProxy.succeeds({ filePath: linkPathAbs });
      symlinkProxy.succeeds({ targetPath: targetDirAbs, linkPath: linkPathAbs });
    },

    getSymlinkCalls: (): readonly { targetPath: unknown; linkPath: unknown; type: unknown }[] =>
      symlinkProxy.getCalls(),

    getReadlinkCalls: (): readonly unknown[] => readlinkProxy.getCalls(),

    getUnlinkedPaths: (): readonly unknown[] => unlinkProxy.getDeletedPaths(),

    // Cross-mock order cannot be read off either adapter proxy alone — each only tracks its own
    // call history — so this reads jest's own invocationCallOrder off the two underlying
    // 'fs/promises' exports directly, the same technique quest-chat-responder.proxy.ts uses to
    // prove resume precedes start-chat.
    assertMkdirCalledBeforeSymlink: (): boolean => {
      const mkdirFn = mkdir as jest.MockedFunction<typeof mkdir>;
      const symlinkFn = symlink as jest.MockedFunction<typeof symlink>;
      const [mkdirOrder] = mkdirFn.mock.invocationCallOrder;
      const [symlinkOrder] = symlinkFn.mock.invocationCallOrder;
      if (mkdirOrder === undefined || symlinkOrder === undefined) {
        return false;
      }
      return mkdirOrder < symlinkOrder;
    },
  };
};
