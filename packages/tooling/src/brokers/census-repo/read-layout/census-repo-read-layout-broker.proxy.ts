import { globProxy } from '#gateway/npm/glob/glob/glob.proxy';
import { readJsonFileProxy } from '#gateway/node/fs__promises/read-json-file/read-json-file.proxy';
import { censusLayoutStatics } from '../../../statics/census-layout/census-layout-statics';
import type { AbsoluteFilePath } from '../../../contracts/absolute-file-path/absolute-file-path-contract';

export const censusRepoReadLayoutBrokerProxy = (): {
  setupRoot: (params: { repoRoot: AbsoluteFilePath; rawContents: string }) => void;
  setupMissingRoot: (params: { repoRoot: AbsoluteFilePath }) => void;
  setupPackages: (params: {
    repoRoot: AbsoluteFilePath;
    packages: readonly { dir: string; rawContents: string }[];
  }) => void;
} => {
  const globHandle = globProxy();
  const jsonHandle = readJsonFileProxy();

  return {
    setupRoot: ({ repoRoot, rawContents }): void => {
      jsonHandle.returnsRaw({
        path: `${repoRoot}/${censusLayoutStatics.packageJsonFile}`,
        rawContents,
      });
    },
    setupMissingRoot: ({ repoRoot }): void => {
      jsonHandle.missing({ path: `${repoRoot}/${censusLayoutStatics.packageJsonFile}` });
    },
    setupPackages: ({ repoRoot, packages }): void => {
      globHandle.returns({
        pattern: [...censusLayoutStatics.packageJsonGlobs],
        options: { cwd: repoRoot, ignore: censusLayoutStatics.ignore },
        matches: packages.map(
          ({ dir }) => `${repoRoot}/${dir}/${censusLayoutStatics.packageJsonFile}`,
        ),
      });
      for (const { dir, rawContents } of packages) {
        jsonHandle.returnsRaw({
          path: `${repoRoot}/${dir}/${censusLayoutStatics.packageJsonFile}`,
          rawContents,
        });
      }
    },
  };
};
