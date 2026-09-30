import { existsSyncProxy } from '#gateway/node/fs/exists-sync/exists-sync.proxy';
import { join } from '#gateway/node/path';

import { binWorkspaceRootLayerBrokerProxy } from './bin-workspace-root-layer-broker.proxy';

export const binWalkUpLayerBrokerProxy = (): {
  setupWalk: (params: {
    dir: string;
    binName: string;
    binDir: string | null;
    workspaceRoot: string | null;
  }) => string;
} => {
  const existsProxy = existsSyncProxy();
  const rootProxy = binWorkspaceRootLayerBrokerProxy();

  return {
    // Stages exactly the directories the walk visits, deepest first, up to the first one holding
    // the binary (`binDir`) or, failing that, the one declaring workspaces (`workspaceRoot`), or the
    // filesystem root. A walk that overshoots its stopping point reads an unstaged path and
    // throws, so the tests fail on it instead of passing over it. A directory holding the binary
    // never has its package.json read, so it is left unstaged for whatever else stages it.
    // Returns the command the walk resolves to, so composing proxies can address the downstream
    // spawn with it.
    setupWalk: ({
      dir,
      binName,
      binDir,
      workspaceRoot,
    }: {
      dir: string;
      binName: string;
      binDir: string | null;
      workspaceRoot: string | null;
    }): string => {
      const segments = dir
        .split('/')
        .filter((segment) => segment !== '');
      const deepestFirst = [
        '/',
        ...segments.map((_segment, index) => `/${segments.slice(0, index + 1).join('/')}`),
      ].reverse();
      const holdsBinary = (ancestor: string): boolean =>
        binDir !== null && binDir === ancestor;
      const stopIndex = deepestFirst.findIndex(
        (ancestor) =>
          holdsBinary(ancestor) || (workspaceRoot !== null && workspaceRoot === ancestor),
      );
      const visited = stopIndex === -1 ? deepestFirst : deepestFirst.slice(0, stopIndex + 1);

      visited.forEach((ancestor) => {
        const ancestorDir = ancestor;
        existsProxy.returns({
          path: join(ancestorDir, 'node_modules', '.bin', binName),
          exists: holdsBinary(ancestor),
        });
        if (holdsBinary(ancestor)) {
          return;
        }
        if (workspaceRoot !== null && workspaceRoot === ancestor) {
          rootProxy.setupWorkspaceRoot({ dir: ancestorDir });
        } else {
          rootProxy.setupNoPackageJson({ dir: ancestorDir });
        }
      });

      return stopIndex !== -1 && binDir !== null && holdsBinary(deepestFirst[stopIndex] ?? '')
        ? join(binDir, 'node_modules', '.bin', binName)
        : binName;
    },
  };
};
