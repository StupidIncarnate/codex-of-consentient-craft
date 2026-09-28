import { globProxy } from '#gateway/npm/glob/glob/glob.proxy';
import { censusRepoReadSourcesChunkLayerBrokerProxy } from './census-repo-read-sources-chunk-layer-broker.proxy';
import { censusLayoutStatics } from '../../../statics/census-layout/census-layout-statics';
import type { AbsoluteFilePath } from '../../../contracts/absolute-file-path/absolute-file-path-contract';

export const censusRepoReadSourcesBrokerProxy = (): {
  setupSources: (params: {
    repoRoot: AbsoluteFilePath;
    files: readonly { path: string; contents: string }[];
  }) => void;
} => {
  const globHandle = globProxy();
  const chunkProxy = censusRepoReadSourcesChunkLayerBrokerProxy();

  return {
    setupSources: ({ repoRoot, files }): void => {
      globHandle.returns({
        pattern: censusLayoutStatics.sourceGlob,
        options: { cwd: repoRoot, ignore: censusLayoutStatics.ignore },
        matches: files.map(({ path }) => path),
      });
      for (const { path, contents } of files) {
        chunkProxy.setupFile({ path, contents });
      }
    },
  };
};
