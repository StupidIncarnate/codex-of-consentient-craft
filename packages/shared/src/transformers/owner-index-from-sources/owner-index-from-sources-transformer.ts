/**
 * PURPOSE: Builds the owner index from source text already read: every exported object contract in
 * a non-layer `-contract.ts` file with its owner name, package, schema text and how each key gets its
 * value, every standalone brand contract, every `z.enum([...])` contract with its sorted values, and
 * each package's dependencies. A `-layer-contract.ts`
 * file records nothing, so a layer never claims an owner name. A key that points at a standalone
 * brand contract by a name with one brand text becomes a brand-ref carrying that text. Reach for
 * this over contractIndexFromSourcesTransformer when the question is who owns a name or a key.
 *
 * USAGE:
 * ownerIndexFromSourcesTransformer({ rootDir, packages, sources });
 * // Returns OwnerIndex — owners, standaloneBrands, enums and packages
 */
import * as ts from '#gateway/npm/typescript';

import type { ContentText } from '../../contracts/content-text/content-text-contract';
import type { OwnerIndexEnum } from '../../contracts/owner-index-enum/owner-index-enum-contract';
import type { OwnerIndexOwner } from '../../contracts/owner-index-owner/owner-index-owner-contract';
import type { OwnerIndexPackage } from '../../contracts/owner-index-package/owner-index-package-contract';
import type { OwnerIndexStandaloneBrand } from '../../contracts/owner-index-standalone-brand/owner-index-standalone-brand-contract';
import { ownerIndexContract } from '../../contracts/owner-index/owner-index-contract';
import type { OwnerIndex } from '../../contracts/owner-index/owner-index-contract';
import { identifierContract } from '../../contracts/identifier/identifier-contract';
import { packageNameContract } from '../../contracts/package-name/package-name-contract';
import { isProductionSourceFileGuard } from '../../guards/is-production-source-file/is-production-source-file-guard';
import { contractFileOwnersReadLayerTransformer } from './contract-file-owners-read-layer-transformer';

const CONTRACT_FILE_PATTERN = /\/contracts\/(?:.*\/)?[^/]+-contract\.ts$/u;
const LAYER_FILE_SUFFIX = '-layer-contract.ts';

export const ownerIndexFromSourcesTransformer = ({
  rootDir,
  packages,
  sources,
}: {
  rootDir: string;
  packages: OwnerIndexPackage[];
  sources: { filePath: string; text: ContentText }[];
}): OwnerIndex => {
  const rootPrefixLength = rootDir.length + 1;

  const reads = sources
    .filter(
      ({ filePath }) =>
        CONTRACT_FILE_PATTERN.test(filePath) &&
        !filePath.endsWith(LAYER_FILE_SUFFIX) &&
        isProductionSourceFileGuard({ relativePath: filePath.slice(rootPrefixLength) }),
    )
    .map(({ filePath, text }) => {
      const [owningPackage] = packages
        .filter((candidate) => filePath.startsWith(`${candidate.dir}/`))
        .sort((left, right) => right.dir.length - left.dir.length);
      return contractFileOwnersReadLayerTransformer({
        sourceFile: ts.createSourceFile(filePath, text, ts.ScriptTarget.Latest, true),
        filePath,
        packageName: owningPackage?.name ?? packageNameContract.parse('unknown'),
      });
    });

  const standaloneBrands: OwnerIndexStandaloneBrand[] = reads.flatMap(
    (read) => read.standaloneBrands,
  );

  const textsByName = new Map<string, Set<string>>();
  for (const { contractName, brandText } of standaloneBrands) {
    textsByName.set(
      contractName,
      (textsByName.get(contractName) ?? new Set<string>()).add(brandText),
    );
  }

  const owners: OwnerIndexOwner[] = reads
    .flatMap((read) => read.owners)
    .map((owner) => ({
      ...owner,
      fields: owner.fields.map((field) => {
        const texts =
          field.kind === 'contract-ref' && field.refContractName !== undefined
            ? [...(textsByName.get(field.refContractName) ?? [])]
            : [];
        const [onlyText] = texts;
        return texts.length === 1 && onlyText !== undefined
          ? { ...field, kind: 'brand-ref' as const, brandText: identifierContract.parse(onlyText) }
          : field;
      }),
    }));

  const enums: OwnerIndexEnum[] = reads.flatMap((read) => read.enums);

  return ownerIndexContract.parse({ owners, standaloneBrands, enums, packages });
};
