/**
 * PURPOSE: Builds the owner index from source text already read: every exported object contract in
 * a non-layer `-contract.ts` file with its owner name, package, schema text and how each key gets its
 * value, every standalone brand contract, every `z.enum([...])` contract with its sorted values, and
 * each package's dependencies. A `-layer-contract.ts` file records nothing, so a layer never claims
 * an owner name. Each file is read by ownerIndexFileReadTransformer and the reads are merged by
 * ownerIndexFromReadsTransformer, the same two steps the owner index cache runs per file. Reach
 * for this over contractIndexFromSourcesTransformer when the question is who owns a name or a key.
 *
 * USAGE:
 * ownerIndexFromSourcesTransformer({ rootDir, packages, sources });
 * // Returns OwnerIndex — owners, standaloneBrands, enums and packages
 */
import type { OwnerIndexPackage } from '../../contracts/owner-index-package/owner-index-package-contract';
import type { OwnerIndex } from '../../contracts/owner-index/owner-index-contract';
import { isContractSourceFileGuard } from '../../guards/is-contract-source-file/is-contract-source-file-guard';
import { ownerIndexStatics } from '../../statics/owner-index/owner-index-statics';
import { ownerIndexFileReadTransformer } from '../owner-index-file-read/owner-index-file-read-transformer';
import { ownerIndexFromReadsTransformer } from '../owner-index-from-reads/owner-index-from-reads-transformer';

export const ownerIndexFromSourcesTransformer = ({
  rootDir,
  packages,
  sources,
}: {
  rootDir: string;
  packages: OwnerIndexPackage[];
  sources: { filePath: string; text: string }[];
}): OwnerIndex => {
  const rootPrefixLength = rootDir.length + 1;

  const reads = sources
    .filter(
      ({ filePath }) =>
        !filePath.endsWith(ownerIndexStatics.layerContractSuffix) &&
        isContractSourceFileGuard({ relativePath: filePath.slice(rootPrefixLength) }),
    )
    .map(({ filePath, text }) => {
      const [owningPackage] = packages
        .filter((candidate) => filePath.startsWith(`${candidate.dir}/`))
        .sort((left, right) => right.dir.length - left.dir.length);
      return ownerIndexFileReadTransformer({
        filePath,
        text,
        packageName: owningPackage?.name ?? 'unknown',
      });
    });

  return ownerIndexFromReadsTransformer({ packages, reads });
};
