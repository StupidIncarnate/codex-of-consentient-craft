/**
 * PURPOSE: Reads one non-layer `-contract.ts` file's share of the owner index from its source text:
 * its object contracts with their keys, its standalone brand contracts and its enum contracts, all
 * attributed to the package given. A key that points at another contract stays a contract-ref here;
 * only ownerIndexFromReadsTransformer, which sees every file, can turn it into a brand-ref. Reach for
 * this when a caller keeps one file's read on its own, as the owner index cache does per file.
 *
 * USAGE:
 * ownerIndexFileReadTransformer({ filePath: '/repo/packages/a/src/contracts/x/x-contract.ts', text, packageName: '@repo/a' });
 * // Returns ContractFileOwnersReadLayer — { owners, standaloneBrands, enums } for that one file
 */
import * as ts from '#gateway/npm/typescript';

import type { ContractFileOwnersReadLayer } from '../../contracts/contract-file-owners-read-layer/contract-file-owners-read-layer-contract';
import { contractFileOwnersReadLayerTransformer } from './contract-file-owners-read-layer-transformer';

export const ownerIndexFileReadTransformer = ({
  filePath,
  text,
  packageName,
}: {
  filePath: string;
  text: string;
  packageName: string;
}): ContractFileOwnersReadLayer =>
  contractFileOwnersReadLayerTransformer({
    sourceFile: ts.createSourceFile(filePath, text, ts.ScriptTarget.Latest, true),
    filePath,
    packageName,
  });
