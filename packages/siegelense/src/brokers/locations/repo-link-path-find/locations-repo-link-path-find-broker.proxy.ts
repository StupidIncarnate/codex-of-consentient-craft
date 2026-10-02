import { join } from '#gateway/node/path';
import { existsSyncProxy } from '#gateway/node/fs/exists-sync/exists-sync.proxy';
import { realpathProxy } from '#gateway/node/fs__promises/realpath/realpath.proxy';
import { registerMock } from '@dungeonmaster/testing/register-mock';
import { locationsStatics } from '@dungeonmaster/shared/statics';

import { locationsRootPathFindBrokerProxy } from '../root-path-find/locations-root-path-find-broker.proxy';

export const locationsRepoLinkPathFindBrokerProxy = (): {
  setupLinkResolvesToRoot: (params: {
    repoRoot: string;
    linkPath: string;
    homeDir: string;
    homePath: string;
    rootPath: string;
  }) => void;
  setupLinkAbsent: (params: { repoRoot: string; linkPath: string }) => void;
  setupLinkPointsElsewhere: (params: {
    repoRoot: string;
    linkPath: string;
    homeDir: string;
    homePath: string;
    rootPath: string;
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
  setupHomeOnly: (params: { homeDir: string; homePath: string }) => void;
} => {
  // #gateway/node/path is a raw passthrough of the Node 'path' module (no per-function wrapper,
  // so no gateway proxy to compose) — mocked directly here, on the same '#gateway/node/path'
  // specifier the broker imports. Shared with locationsRootPathFindBrokerProxy's own join handle
  // (composed transitively below), so its sticky real-passthrough default already covers any call
  // this file leaves unaddressed.
  const joinHandle = registerMock({ fn: join });
  const existsProxy = existsSyncProxy();
  const rootPathProxy = locationsRootPathFindBrokerProxy();
  const linkRealpath = realpathProxy();

  const stageOuterJoin = ({ repoRoot, linkPath }: { repoRoot: string; linkPath: string }): void => {
    joinHandle
      .calledWith([
        repoRoot,
        locationsStatics.repoRoot.dungeonmasterAssets,
        locationsStatics.repoRoot.siegelenseLink,
      ])
      .returns(linkPath);
  };

  return {
    setupLinkResolvesToRoot: ({
      repoRoot,
      linkPath,
      homeDir,
      homePath,
      rootPath,
    }: {
      repoRoot: string;
      linkPath: string;
      homeDir: string;
      homePath: string;
      rootPath: string;
    }): void => {
      stageOuterJoin({ repoRoot, linkPath });
      existsProxy.returns({ path: linkPath, exists: true });
      rootPathProxy.setupRootPath({ homeDir, homePath, rootPath });
      linkRealpath.returns({ path: linkPath, resolved: rootPath });
    },

    setupLinkAbsent: ({ repoRoot, linkPath }: { repoRoot: string; linkPath: string }): void => {
      stageOuterJoin({ repoRoot, linkPath });
      existsProxy.returns({ path: linkPath, exists: false });
    },

    setupLinkPointsElsewhere: ({
      repoRoot,
      linkPath,
      homeDir,
      homePath,
      rootPath,
      elsewhereTarget,
    }: {
      repoRoot: string;
      linkPath: string;
      homeDir: string;
      homePath: string;
      rootPath: string;
      elsewhereTarget: string;
    }): void => {
      stageOuterJoin({ repoRoot, linkPath });
      existsProxy.returns({ path: linkPath, exists: true });
      rootPathProxy.setupRootPath({ homeDir, homePath, rootPath });
      linkRealpath.returns({ path: linkPath, resolved: elsewhereTarget });
    },

    // callsMatching([]) hands back a RecordedCalls with no `.at()` (see mock-handle-contract.ts) —
    // spreading it into a real array is how an unaddressed read is meant to inspect "the whole
    // list" here, since this broker makes exactly one join() call per invocation.
    getJoinedSegments: (): unknown => [...joinHandle.callsMatching([])].at(-1),

    setupHomeOnly: (params: { homeDir: string; homePath: string }): void => {
      rootPathProxy.setupHomeOnly(params);
    },
  };
};
