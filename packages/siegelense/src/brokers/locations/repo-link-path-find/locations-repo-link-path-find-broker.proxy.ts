import { join } from '#gateway/node/path';
import { cwd } from '#gateway/node/process';
import { cwdProxy } from '#gateway/node/process/cwd/cwd.proxy';
import { existsSyncProxy } from '#gateway/node/fs/exists-sync/exists-sync.proxy';
import { realpathProxy } from '#gateway/node/fs__promises/realpath/realpath.proxy';
import { registerMock } from '@dungeonmaster/testing/register-mock';
import { cwdResolveBrokerProxy } from '@dungeonmaster/shared/brokers/cwd/resolve/cwd-resolve-broker.proxy';
import { locationsStatics } from '@dungeonmaster/shared/statics';
import type { FilePath } from '@dungeonmaster/shared/contracts';

import { locationsRootPathFindBrokerProxy } from '../root-path-find/locations-root-path-find-broker.proxy';

export const locationsRepoLinkPathFindBrokerProxy = (): {
  setupLinkResolvesToRoot: (params: {
    cwdPath: string;
    linkPath: FilePath;
    homeDir: string;
    homePath: FilePath;
    rootPath: FilePath;
  }) => void;
  setupLinkAbsent: (params: { cwdPath: string; linkPath: FilePath }) => void;
  setupLinkPointsElsewhere: (params: {
    cwdPath: string;
    linkPath: FilePath;
    homeDir: string;
    homePath: FilePath;
    rootPath: FilePath;
    elsewhereTarget: string;
  }) => void;
  // The address for path.join is its SEGMENTS (see packages/testing/CLAUDE.md). registerMock keys
  // on the `join` function reference, so a second registration here reads the SAME shared call
  // history the exact-tuple stages above already record — this is the only way this broker's own
  // test can prove which segments IT composed.
  getJoinedSegments: () => unknown;
  // Forwards to locationsRootPathFindBrokerProxy's own addressed-only stage — see its header
  // comment for why a caller composed alongside another real-path.join-making resolver needs this
  // instead of setupLinkResolvesToRoot/setupLinkPointsElsewhere (both of which also stage the link
  // check itself, which a caller controlling that check independently — instanceKillBrokerProxy's
  // convention — cannot risk double-staging).
  setupHomeOnly: (params: { homeDir: string; homePath: FilePath }) => void;
  // A caller that needs THIS broker's `cwd()` call to resolve to a specific, known value — every
  // scenario runs it unconditionally, before the link check ever gets staged — without wanting the
  // full setupLinkResolvesToRoot/setupLinkAbsent/setupLinkPointsElsewhere scenario staged too.
  setupCwd: (params: { cwdPath: string }) => void;
} => {
  // #gateway/node/process/cwd/cwd.proxy has nothing to stage (a real read with nothing to fake),
  // but enforce-proxy-child-creation still requires composing it since the broker imports `cwd`.
  cwdProxy();
  const cwdHandle = registerMock({ fn: cwd });
  // cwd() takes no arguments — there is no call-site value to key on, so [] is the honest address.
  // No default: every caller composing this proxy stages it explicitly, via `setupCwd` or a
  // scenario method (`setupLinkResolvesToRoot`/`setupLinkAbsent`/`setupLinkPointsElsewhere`, via
  // `stageOuterJoin` below) — instanceReserveBroker's own git-branch lookup shares this same cwd()
  // mock, and a caller composed alongside it (instanceStartBrokerProxy's convention) stages this
  // address too, so no test ever reads the real working directory.
  const resolveProxy = cwdResolveBrokerProxy();
  // #gateway/node/path is a raw passthrough of the Node 'path' module (no per-function wrapper,
  // so no gateway proxy to compose) — mocked directly here, on the same '#gateway/node/path'
  // specifier the broker imports. Shared with locationsRootPathFindBrokerProxy's own join handle
  // (composed transitively below), so its sticky real-passthrough default already covers any call
  // this file leaves unaddressed.
  const joinHandle = registerMock({ fn: join });
  const existsProxy = existsSyncProxy();
  const rootPathProxy = locationsRootPathFindBrokerProxy();
  const linkRealpath = realpathProxy();

  const stageOuterJoin = ({ cwdPath, linkPath }: { cwdPath: string; linkPath: FilePath }): void => {
    cwdHandle.calledWith([]).returns(cwdPath);
    resolveProxy.setupRepoRootFoundAtStart({ startPath: cwdPath });
    joinHandle
      .calledWith([
        cwdPath,
        locationsStatics.repoRoot.dungeonmasterAssets,
        locationsStatics.repoRoot.siegelenseLink,
      ])
      .returns(linkPath);
  };

  return {
    setupLinkResolvesToRoot: ({
      cwdPath,
      linkPath,
      homeDir,
      homePath,
      rootPath,
    }: {
      cwdPath: string;
      linkPath: FilePath;
      homeDir: string;
      homePath: FilePath;
      rootPath: FilePath;
    }): void => {
      stageOuterJoin({ cwdPath, linkPath });
      existsProxy.returns({ path: linkPath, exists: true });
      rootPathProxy.setupRootPath({ homeDir, homePath, rootPath });
      linkRealpath.returns({ path: linkPath, resolved: rootPath });
    },

    setupLinkAbsent: ({ cwdPath, linkPath }: { cwdPath: string; linkPath: FilePath }): void => {
      stageOuterJoin({ cwdPath, linkPath });
      existsProxy.returns({ path: linkPath, exists: false });
    },

    setupLinkPointsElsewhere: ({
      cwdPath,
      linkPath,
      homeDir,
      homePath,
      rootPath,
      elsewhereTarget,
    }: {
      cwdPath: string;
      linkPath: FilePath;
      homeDir: string;
      homePath: FilePath;
      rootPath: FilePath;
      elsewhereTarget: string;
    }): void => {
      stageOuterJoin({ cwdPath, linkPath });
      existsProxy.returns({ path: linkPath, exists: true });
      rootPathProxy.setupRootPath({ homeDir, homePath, rootPath });
      linkRealpath.returns({ path: linkPath, resolved: elsewhereTarget });
    },

    // callsMatching([]) hands back a RecordedCalls with no `.at()` (see mock-handle-contract.ts) —
    // spreading it into a real array is how an unaddressed read is meant to inspect "the whole
    // list" here, since this broker makes exactly one join() call per invocation.
    getJoinedSegments: (): unknown => [...joinHandle.callsMatching([])].at(-1),

    setupHomeOnly: (params: { homeDir: string; homePath: FilePath }): void => {
      rootPathProxy.setupHomeOnly(params);
    },

    setupCwd: ({ cwdPath }: { cwdPath: string }): void => {
      cwdHandle.calledWith([]).returns(cwdPath);
    },
  };
};
