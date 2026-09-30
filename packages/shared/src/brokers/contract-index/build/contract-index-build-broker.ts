/**
 * PURPOSE: Reads every workspace package's production TypeScript under a repo root and builds the
 * contract index once per process per root, so a lint rule asking "does production code parse this
 * contract?" answers from one repo-wide read instead of one per file. A long-lived process (an
 * editor's ESLint server) keeps the index it first built. Reach for this over
 * contractIndexFromSourcesTransformer when you have a directory, not source text already in hand.
 *
 * USAGE:
 * contractIndexBuildBroker({ rootDir: absoluteFilePathContract.parse('/repo') });
 * // Returns ContractIndexEntry[] — one per `-contract.ts` file
 */
import { readFileSync, readJsonFileSyncIfExists, walkFilesSync } from '#gateway/node/fs';

import { contractIndexPackageContract } from '../../../contracts/contract-index-package/contract-index-package-contract';
import type { ContractIndexEntry } from '../../../contracts/contract-index-entry/contract-index-entry-contract';
import { packageJsonContract } from '../../../contracts/package-json/package-json-contract';
import { isContractParseSourceFileGuard } from '../../../guards/is-contract-parse-source-file/is-contract-parse-source-file-guard';
import { contractIndexStatics } from '../../../statics/contract-index/contract-index-statics';
import { contractIndexFromSourcesTransformer } from '../../../transformers/contract-index-from-sources/contract-index-from-sources-transformer';
import { subfolderPathsListLayerBroker } from './subfolder-paths-list-layer-broker';

const builtIndexes = new Map<string, ContractIndexEntry[]>();

export const contractIndexBuildBroker = ({
  rootDir,
}: {
  rootDir: string;
}): ContractIndexEntry[] => {
  const cached = builtIndexes.get(rootDir);
  if (cached !== undefined) {
    return cached;
  }

  const packagesDir = `${rootDir}/packages`;
  const packageDirs = subfolderPathsListLayerBroker({ dirPath: packagesDir }).flatMap((dir) =>
    dir.slice(packagesDir.length + 1).startsWith(contractIndexStatics.scan.scopeFolderPrefix)
      ? subfolderPathsListLayerBroker({ dirPath: dir })
      : [dir],
  );

  const packages = packageDirs.flatMap((dir) => {
    const parsed = packageJsonContract.safeParse(readJsonFileSyncIfExists(`${dir}/package.json`));
    const name = parsed.success ? parsed.data.name : undefined;
    return name === undefined ? [] : [contractIndexPackageContract.parse({ name, dir })];
  });

  const sources = packages
    .flatMap(({ dir }) =>
      contractIndexStatics.scan.sourceSuffixes.flatMap((suffix) =>
        walkFilesSync({ rootPath: dir, suffix }),
      ),
    )
    .map((file) => file.path)
    .filter((filePath) =>
      isContractParseSourceFileGuard({ relativePath: filePath.slice(rootDir.length + 1) }),
    )
    .map((filePath) => ({
      filePath,
      text: readFileSync(filePath),
    }));

  const entries = contractIndexFromSourcesTransformer({ rootDir, packages, sources });
  builtIndexes.set(rootDir, entries);
  return entries;
};
