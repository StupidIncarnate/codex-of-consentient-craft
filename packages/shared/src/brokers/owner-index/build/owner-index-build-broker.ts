/**
 * PURPOSE: Builds the owner index for a repo root once per process per root: every object contract
 * and standalone brand contract in the workspace packages, plus each package's workspace
 * dependencies, so a rule asks "who owns this name" from one repo-wide read. It takes its package
 * list and contract files from contractIndexBuildBroker, so both indexes agree on what a package and
 * a contract file are. Reach for this over ownerIndexFromSourcesTransformer when you have a directory,
 * not source text already in hand. A long-lived process keeps the index it first built; the index
 * is built for ward and never for the pre-edit hook, whose cost on every edit is unmeasured.
 *
 * USAGE:
 * ownerIndexBuildBroker({ rootDir: '/repo' });
 * // Returns OwnerIndex — owners, standaloneBrands and packages
 */
import { readFileSync, readJsonFileSyncIfExists } from '#gateway/node/fs';

import { ownerIndexPackageContract } from '../../../contracts/owner-index-package/owner-index-package-contract';
import type { OwnerIndexPackage } from '../../../contracts/owner-index-package/owner-index-package-contract';
import type { OwnerIndex } from '../../../contracts/owner-index/owner-index-contract';
import { packageJsonContract } from '../../../contracts/package-json/package-json-contract';
import { ownerIndexFromSourcesTransformer } from '../../../transformers/owner-index-from-sources/owner-index-from-sources-transformer';
import { contractIndexBuildBroker } from '../../contract-index/build/contract-index-build-broker';

const SOURCE_FOLDER = '/src/';

const builtIndexes = new Map<string, OwnerIndex>();

export const ownerIndexBuildBroker = ({ rootDir }: { rootDir: string }): OwnerIndex => {
  const cached = builtIndexes.get(rootDir);
  if (cached !== undefined) {
    return cached;
  }

  const entries = contractIndexBuildBroker({ rootDir });

  const dirsByName = new Map<string, string>();
  for (const { filePath, packageName } of entries) {
    const sourceIndex = filePath.indexOf(SOURCE_FOLDER);
    if (sourceIndex > 0) {
      dirsByName.set(packageName, filePath.slice(0, sourceIndex));
    }
  }

  const packages: OwnerIndexPackage[] = [...dirsByName].map(([name, dir]) => {
    const parsed = packageJsonContract.safeParse(readJsonFileSyncIfExists(`${dir}/package.json`));
    const dependencies = parsed.success
      ? Object.keys(parsed.data.dependencies ?? {})
          .map((dependency) => dependency)
          .filter((dependency) => dirsByName.has(dependency))
      : [];
    return ownerIndexPackageContract.parse({ name, dir, dependencies });
  });

  const sources = entries
    .filter(({ isLayer }) => !isLayer)
    .map(({ filePath }) => ({
      filePath,
      text: readFileSync(filePath),
    }));

  const ownerIndex = ownerIndexFromSourcesTransformer({ rootDir, packages, sources });
  builtIndexes.set(rootDir, ownerIndex);
  return ownerIndex;
};
