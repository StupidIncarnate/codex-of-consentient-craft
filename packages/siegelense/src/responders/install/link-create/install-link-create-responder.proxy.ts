import { existsSyncProxy } from '#gateway/node/fs/exists-sync/exists-sync.proxy';
import { ensureDirProxy } from '#gateway/node/fs__promises/ensure-dir/ensure-dir.proxy';
import { readlinkProxy } from '#gateway/node/fs__promises/readlink/readlink.proxy';
import { join } from '#gateway/node/path';
import { isNativeErrorProxy } from '#gateway/node/util__types/is-native-error/is-native-error.proxy';
import { AbsoluteFilePathStub, FilePathStub } from '@dungeonmaster/shared/contracts';
import { registerMock, requireActual } from '@dungeonmaster/testing/register-mock';
import { mkdir, readlink, symlink } from 'fs/promises';

import { symlinkProxy } from '#gateway/node/fs__promises/symlink/symlink.proxy';
import { unlinkProxy } from '#gateway/node/fs__promises/unlink/unlink.proxy';
import { locationsRootPathFindBrokerProxy } from '../../../brokers/locations/root-path-find/locations-root-path-find-broker.proxy';
import { InstallLinkCreateResponder } from './install-link-create-responder';

// Every caller in this file exercises targetProjectRoot: '/project', with the siegelense root
// resolved through locationsRootPathFindBrokerProxy to TARGET_DIR_VALUE (never through
// context.dungeonmasterRoot — the responder no longer reads that field), so every setup method
// targets the same pair. LINK_PATH_VALUE nests under ASSETS_DIR_VALUE — the parent this responder
// `mkdir -p`s into existence before the link is ever touched.
const TARGET_DIR_VALUE = '/home/user/.dungeonmaster/siegelense';
const ASSETS_DIR_VALUE = '/project/.dungeonmaster-assets';
const LINK_PATH_VALUE = '/project/.dungeonmaster-assets/siegelense-assets';
// The FLAT legacy path the responder checks unconditionally, on every call, regardless of which
// branch the nested link itself takes — see install-link-create-responder.ts's own local literal.
const LEGACY_LINK_PATH_VALUE = '/project/.siegelense';

const targetDirFp = FilePathStub({ value: TARGET_DIR_VALUE });
const linkPathAbs = AbsoluteFilePathStub({ value: LINK_PATH_VALUE });
const legacyLinkPathAbs = AbsoluteFilePathStub({ value: LEGACY_LINK_PATH_VALUE });

export const InstallLinkCreateResponderProxy = (): {
  callResponder: typeof InstallLinkCreateResponder;
  setupNoLink: () => void;
  setupCorrectLink: () => void;
  setupWrongTarget: (params: { wrongTarget: string }) => void;
  setupLegacySymlinkPresent: () => void;
  setupLegacyRealDirectory: () => void;
  getSymlinkCalls: () => readonly { targetPath: unknown; linkPath: unknown; type: unknown }[];
  getReadlinkCalls: () => readonly unknown[];
  getUnlinkedPaths: () => readonly unknown[];
  getMkdirCalls: () => readonly unknown[];
  getLinkPathJoinArgs: () => readonly unknown[][];
  assertMkdirCalledBeforeSymlink: () => boolean;
} => {
  const rootPathProxy = locationsRootPathFindBrokerProxy();
  // Empty proxy, called only to satisfy enforce-proxy-child-creation for the implementation's
  // isNativeError import — nothing to configure on it.
  isNativeErrorProxy();
  // #gateway/node/path re-exports `join` bare (no per-function proxy of its own, unlike
  // fs/fs__promises/child_process) — mocked directly here, with the same sticky real-passthrough
  // default instance-start-broker.proxy.ts's own `join` staging uses (A12 SL7). `onceFor([])`
  // one-shots below still outrank it for the two calls this file's own implementation makes.
  const realPath = requireActual<{ join: typeof join }>({ module: 'path' });
  const joinHandle = registerMock({ fn: join });
  joinHandle.calledWith([]).implement((...segments: never[]) => realPath.join(...segments));
  const mkdirProxy = ensureDirProxy();
  const existsProxy = existsSyncProxy();
  const linkProxy = symlinkProxy();
  const linkReadlink = readlinkProxy();
  const deleteProxy = unlinkProxy();

  // The responder resolves targetDir first (locationsRootPathFindBroker's own join, staged inside
  // rootPathProxy.setupRootPath at a SPECIFIC address that outranks a bare one-shot), then assetsDir
  // (this file's own join, the parent), then linkPath (joined onto assetsDir, the child) — the
  // one-shot queue above is call-order scoped, so registration order here has to match that
  // execution order. legacyLinkPath's own join call is left unaddressed on purpose: it falls
  // through to the real-passthrough default, which computes '/project/.siegelense' for real.
  const setupTargetDir = (): void => {
    rootPathProxy.setupRootPath({
      homeDir: '/home/user',
      homePath: FilePathStub({ value: '/home/user/.dungeonmaster' }),
      rootPath: targetDirFp,
    });
  };

  // ensureDir runs for BOTH the link's target (the siegelense root it points to) and its own parent
  // (assetsDir) on every path through the responder, regardless of whether the link itself exists
  // yet — so every setup method stages both, in that order.
  const setupBothMkdirs = (): void => {
    mkdirProxy.succeeds({ path: TARGET_DIR_VALUE });
    mkdirProxy.succeeds({ path: ASSETS_DIR_VALUE });
  };

  // The legacy flat `.siegelense` check runs unconditionally on every call, after the nested link's
  // own branch resolves — so every one of this proxy's base setups stages it, defaulting to the
  // ordinary "never was one" case. setupLegacySymlinkPresent/setupLegacyRealDirectory below
  // OVERRIDE this default by re-staging the same address, since registerMock's most-recently-
  // registered same-specificity address wins.
  const setupLegacyAbsent = (): void => {
    linkReadlink.missing({ path: LEGACY_LINK_PATH_VALUE });
  };

  return {
    callResponder: InstallLinkCreateResponder,

    // Neither the target dir nor the link exist yet — the fresh-install case.
    setupNoLink: (): void => {
      setupTargetDir();
      joinHandle.onceFor([]).returns(ASSETS_DIR_VALUE);
      joinHandle.onceFor([]).returns(LINK_PATH_VALUE);
      setupBothMkdirs();
      existsProxy.returns({ path: LINK_PATH_VALUE, exists: false });
      linkProxy.succeeds({ target: TARGET_DIR_VALUE, path: LINK_PATH_VALUE });
      setupLegacyAbsent();
    },

    // The link exists and already reads back the right target — the no-op case.
    setupCorrectLink: (): void => {
      setupTargetDir();
      joinHandle.onceFor([]).returns(ASSETS_DIR_VALUE);
      joinHandle.onceFor([]).returns(LINK_PATH_VALUE);
      setupBothMkdirs();
      existsProxy.returns({ path: LINK_PATH_VALUE, exists: true });
      linkReadlink.returns({ path: LINK_PATH_VALUE, target: TARGET_DIR_VALUE });
      setupLegacyAbsent();
    },

    // The link exists but stores a different target — a leftover from another checkout.
    setupWrongTarget: ({ wrongTarget }: { wrongTarget: string }): void => {
      setupTargetDir();
      joinHandle.onceFor([]).returns(ASSETS_DIR_VALUE);
      joinHandle.onceFor([]).returns(LINK_PATH_VALUE);
      setupBothMkdirs();
      existsProxy.returns({ path: LINK_PATH_VALUE, exists: true });
      linkReadlink.returns({ path: LINK_PATH_VALUE, target: wrongTarget });
      deleteProxy.succeeds({ path: linkPathAbs });
      linkProxy.succeeds({ target: TARGET_DIR_VALUE, path: LINK_PATH_VALUE });
      setupLegacyAbsent();
    },

    // Layered onto setupCorrectLink's base (nested link already right) — the flat legacy path is
    // itself a symlink, so the responder must unlink it.
    setupLegacySymlinkPresent: (): void => {
      setupTargetDir();
      joinHandle.onceFor([]).returns(ASSETS_DIR_VALUE);
      joinHandle.onceFor([]).returns(LINK_PATH_VALUE);
      setupBothMkdirs();
      existsProxy.returns({ path: LINK_PATH_VALUE, exists: true });
      linkReadlink.returns({ path: LINK_PATH_VALUE, target: TARGET_DIR_VALUE });
      linkReadlink.returns({ path: LEGACY_LINK_PATH_VALUE, target: TARGET_DIR_VALUE });
      deleteProxy.succeeds({ path: legacyLinkPathAbs });
    },

    // Layered onto setupCorrectLink's base — the flat legacy path exists but is a real directory or
    // file, never a symlink, so the responder must never unlink it.
    setupLegacyRealDirectory: (): void => {
      setupTargetDir();
      joinHandle.onceFor([]).returns(ASSETS_DIR_VALUE);
      joinHandle.onceFor([]).returns(LINK_PATH_VALUE);
      setupBothMkdirs();
      existsProxy.returns({ path: LINK_PATH_VALUE, exists: true });
      linkReadlink.returns({ path: LINK_PATH_VALUE, target: TARGET_DIR_VALUE });
      linkReadlink.notALink({ path: LEGACY_LINK_PATH_VALUE });
    },

    getSymlinkCalls: (): readonly { targetPath: unknown; linkPath: unknown; type: unknown }[] =>
      linkProxy
        .getCallsFor({ target: () => true, path: () => true })
        .map((call) => ({ targetPath: call[0], linkPath: call[1], type: call[2] })),

    getReadlinkCalls: (): readonly unknown[] =>
      (readlink as jest.MockedFunction<typeof readlink>).mock.calls.map(([path]) => path),

    getUnlinkedPaths: (): readonly unknown[] =>
      deleteProxy
        .getCallsFor({
          path: (value: unknown): boolean => value === linkPathAbs || value === legacyLinkPathAbs,
        })
        .map((call) => call[0]),

    // Reads jest's own recorded calls off the real 'fs/promises' mkdir directly, in real
    // invocation order — ensureDirProxy's own getCallsFor is addressed per-path, and combining two
    // separately-addressed lists cannot recover the ORDER a single real call sequence has, which
    // this responder's own two-mkdir-then-symlink ordering assertion depends on.
    getMkdirCalls: (): readonly unknown[] =>
      (mkdir as jest.MockedFunction<typeof mkdir>).mock.calls.map(([path]) => path),

    // The nested link's own join call is addressed by its FIRST argument, ASSETS_DIR_VALUE — the
    // one call among the four this file's join queue answers whose first segment is the assets
    // parent, so this reads back the exact tuple the real code passed rather than trusting the
    // staged return value, which answers any call regardless of its real arguments. Proves a
    // broken LINK_ENTRY segment in the real implementation shows up here even though the queued
    // return value would otherwise mask it.
    getLinkPathJoinArgs: (): readonly unknown[][] => joinHandle.callsMatching([ASSETS_DIR_VALUE]),

    // Cross-mock order cannot be read off either adapter proxy alone — each only tracks its own
    // call history — so this reads jest's own invocationCallOrder off the two underlying
    // 'fs/promises' exports directly, the same technique quest-chat-responder.proxy.ts uses to
    // prove resume precedes start-chat. Two mkdir calls happen per run now (target, then assets
    // parent), so this takes the LATEST mkdir order — symlink must follow both, not just the first.
    assertMkdirCalledBeforeSymlink: (): boolean => {
      const mkdirFn = mkdir as jest.MockedFunction<typeof mkdir>;
      const symlinkFn = symlink as jest.MockedFunction<typeof symlink>;
      const mkdirOrders = mkdirFn.mock.invocationCallOrder;
      const [symlinkOrder] = symlinkFn.mock.invocationCallOrder;
      if (mkdirOrders.length === 0 || symlinkOrder === undefined) {
        return false;
      }
      return Math.max(...mkdirOrders) < symlinkOrder;
    },
  };
};
