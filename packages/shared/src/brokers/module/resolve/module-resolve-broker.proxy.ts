import { resolveModuleIfExistsProxy } from '#gateway/node/module/resolve-module-if-exists/resolve-module-if-exists.proxy';

export const moduleResolveBrokerProxy = (): {
  setupResolvesFromRunRoot: (params: { specifier: string; repoRoot: string; path: string }) => void;
  setupResolvesFromOwnInstall: (params: {
    specifier: string;
    repoRoot: string;
    path: string;
  }) => void;
  setupResolvesNowhere: (params: { specifier: string; repoRoot: string }) => void;
} => {
  const resolveProxy = resolveModuleIfExistsProxy();

  return {
    setupResolvesFromRunRoot: ({
      specifier,
      repoRoot,
      path,
    }: {
      specifier: string;
      repoRoot: string;
      path: string;
    }): void => {
      resolveProxy.returns({ specifier, fromDir: repoRoot, path });
    },

    setupResolvesFromOwnInstall: ({
      specifier,
      repoRoot,
      path,
    }: {
      specifier: string;
      repoRoot: string;
      path: string;
    }): void => {
      resolveProxy.missing({ specifier, fromDir: repoRoot });
      resolveProxy.returns({ specifier, path });
    },

    setupResolvesNowhere: ({
      specifier,
      repoRoot,
    }: {
      specifier: string;
      repoRoot: string;
    }): void => {
      resolveProxy.missing({ specifier, fromDir: repoRoot });
      resolveProxy.missing({ specifier });
    },
  };
};
