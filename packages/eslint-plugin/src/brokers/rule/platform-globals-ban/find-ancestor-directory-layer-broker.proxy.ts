import { existsSyncProxy } from '#gateway/node/fs/exists-sync/exists-sync.proxy';

export const findAncestorDirectoryLayerBrokerProxy = (): {
  setupMarkerAt: ({ dirPath, markerFileName }: { dirPath: string; markerFileName: string }) => void;
  setupNoMarkerAt: ({
    dirPath,
    markerFileName,
  }: {
    dirPath: string;
    markerFileName: string;
  }) => void;
  setupNoMarkerBelow: ({
    dirPath,
    markerFileName,
  }: {
    dirPath: string;
    markerFileName: string;
  }) => void;
} => {
  const existsProxy = existsSyncProxy();

  return {
    // Mirrors real path.join's own normalization (the broker joins via the real path.join): a root dirPath ('/') must not double the leading slash.
    setupMarkerAt: ({
      dirPath,
      markerFileName,
    }: {
      dirPath: string;
      markerFileName: string;
    }): void => {
      existsProxy.returns({
        path: dirPath.endsWith('/')
          ? `${dirPath}${markerFileName}`
          : `${dirPath}/${markerFileName}`,
        exists: true,
      });
    },

    // existsSyncProxy ships no address-less catch-all: a walk-to-root "nothing found" test stages
    // every ancestor level explicitly false, one call per level.
    setupNoMarkerAt: ({
      dirPath,
      markerFileName,
    }: {
      dirPath: string;
      markerFileName: string;
    }): void => {
      existsProxy.returns({
        path: dirPath.endsWith('/')
          ? `${dirPath}${markerFileName}`
          : `${dirPath}/${markerFileName}`,
        exists: false,
      });
    },

    // For a caller whose start directory is arbitrary: the marker in every directory NESTED under
    // `dirPath` is absent. Addressed as "descendant of dirPath", which never overlaps the exact
    // path setupMarkerAt stages.
    setupNoMarkerBelow: ({
      dirPath,
      markerFileName,
    }: {
      dirPath: string;
      markerFileName: string;
    }): void => {
      const own = `${dirPath}/${markerFileName}`;
      existsProxy.returnsMatchingPath({
        path: (value) =>
          typeof value === 'string' &&
          value !== own &&
          value.startsWith(`${dirPath}/`) &&
          value.endsWith(`/${markerFileName}`),
        exists: false,
      });
    },
  };
};
