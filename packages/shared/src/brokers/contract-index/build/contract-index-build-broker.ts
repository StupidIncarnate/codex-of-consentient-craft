/**
 * PURPOSE: Reads every workspace package's production TypeScript under a repo root and builds the
 * contract index once per process per root, so a lint rule asking "does production code parse this
 * contract?" answers from one repo-wide read instead of one per file. A long-lived process (an
 * editor's ESLint server) keeps the index it first built. Reach for this over
 * contractIndexFromSourcesTransformer when you have a directory, not source text already in hand.
 *
 * USAGE:
 * contractIndexBuildBroker({ rootDir: '/repo' });
 * // Returns ContractIndexEntry[] — one per `-contract.ts` file
 */
import { readFileSync, walkFilesSync } from '#gateway/node/fs';

import type { ContractIndexEntry } from '../../../contracts/contract-index-entry/contract-index-entry-contract';
import { isContractParseSourceFileGuard } from '../../../guards/is-contract-parse-source-file/is-contract-parse-source-file-guard';
import { contractIndexStatics } from '../../../statics/contract-index/contract-index-statics';
import { contractIndexFromSourcesTransformer } from '../../../transformers/contract-index-from-sources/contract-index-from-sources-transformer';
import { workspacePackageListBroker } from '../../workspace-package/list/workspace-package-list-broker';

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

  const packages = workspacePackageListBroker({ rootDir });

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
