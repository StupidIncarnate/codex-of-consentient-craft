/**
 * PURPOSE: Builds the contract index from source text already read: for every `-contract.ts` file,
 * what it exports, which production lines parse it, and whether it counts as parsed. A contract
 * counts as parsed when production code parses it, or a field of it, or when a contract that counts
 * as parsed uses it as a value (a nested schema). It counts as WHOLE parsed on the same terms minus
 * the field parse: a parse of the object itself, or nesting inside a contract that is whole parsed.
 * Each file is read by contractIndexFileReadTransformer and the reads are merged by
 * contractIndexFromReadsTransformer, the same two steps the contract index cache runs per file.
 * Reach for this over a text search for `.parse(`, which counts every JSDoc example.
 *
 * USAGE:
 * contractIndexFromSourcesTransformer({ rootDir, packages, sources });
 * // Returns ContractIndexEntry[] — one per `-contract.ts` file under a `contracts/` folder
 */
import type { ContractIndexEntry } from '../../contracts/contract-index-entry/contract-index-entry-contract';
import type { ContractIndexPackage } from '../../contracts/contract-index-package/contract-index-package-contract';
import { isContractParseSourceFileGuard } from '../../guards/is-contract-parse-source-file/is-contract-parse-source-file-guard';
import { isContractSourceFileGuard } from '../../guards/is-contract-source-file/is-contract-source-file-guard';
import { contractIndexFileReadTransformer } from '../contract-index-file-read/contract-index-file-read-transformer';
import { contractIndexFromReadsTransformer } from '../contract-index-from-reads/contract-index-from-reads-transformer';

export const contractIndexFromSourcesTransformer = ({
  rootDir,
  packages,
  sources,
}: {
  rootDir: string;
  packages: ContractIndexPackage[];
  sources: { filePath: string; text: string }[];
}): ContractIndexEntry[] => {
  const rootPrefixLength = rootDir.length + 1;

  return contractIndexFromReadsTransformer({
    rootDir,
    packages,
    files: sources.map(({ filePath, text }) => {
      const relativePath = filePath.slice(rootPrefixLength);
      const isContractFile = isContractSourceFileGuard({ relativePath });
      return {
        filePath,
        read:
          isContractParseSourceFileGuard({ relativePath }) &&
          (isContractFile || text.includes('ontract'))
            ? contractIndexFileReadTransformer({ filePath, text, isContractFile })
            : null,
      };
    }),
  });
};
