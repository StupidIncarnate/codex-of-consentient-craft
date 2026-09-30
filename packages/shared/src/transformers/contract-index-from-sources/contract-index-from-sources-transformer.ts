/**
 * PURPOSE: Builds the contract index from source text already read: for every `-contract.ts` file,
 * what it exports, which production lines parse it, and whether it counts as parsed. A contract
 * counts as parsed when production code parses it, or a field of it, or when a contract that counts
 * as parsed uses it as a value (a nested schema). Reach for this over a text search for `.parse(`,
 * which counts every JSDoc example.
 *
 * USAGE:
 * contractIndexFromSourcesTransformer({ rootDir, packages, sources });
 * // Returns ContractIndexEntry[] — one per `-contract.ts` file under a `contracts/` folder
 */
import * as ts from '#gateway/npm/typescript';

import { contractUsesBindingContract } from '../../contracts/contract-uses-binding/contract-uses-binding-contract';
import { contractIndexEntryContract } from '../../contracts/contract-index-entry/contract-index-entry-contract';
import type { ContractIndexEntry } from '../../contracts/contract-index-entry/contract-index-entry-contract';
import type { ContractIndexPackage } from '../../contracts/contract-index-package/contract-index-package-contract';
import type { ContractParseSite } from '../../contracts/contract-parse-site/contract-parse-site-contract';
import { packageNameContract } from '../../contracts/package-name/package-name-contract';
import { isContractParseSourceFileGuard } from '../../guards/is-contract-parse-source-file/is-contract-parse-source-file-guard';
import { isProductionSourceFileGuard } from '../../guards/is-production-source-file/is-production-source-file-guard';
import { contractFileExportsReadLayerTransformer } from './contract-file-exports-read-layer-transformer';
import { contractFileFindLayerTransformer } from './contract-file-find-layer-transformer';
import { contractUsesScanLayerTransformer } from './contract-uses-scan-layer-transformer';
import { moduleLinksReadLayerTransformer } from './module-links-read-layer-transformer';

const CONTRACT_FILE_PATTERN = /\/contracts\/(?:.*\/)?[^/]+-contract\.ts$/u;

export const contractIndexFromSourcesTransformer = ({
  rootDir,
  packages,
  sources,
}: {
  rootDir: string;
  packages: ContractIndexPackage[];
  sources: { filePath: string; text: string }[];
}): ContractIndexEntry[] => {
  const knownFiles = new Set(sources.map((source) => source.filePath));
  const rootPrefixLength = rootDir.length + 1;

  const contractFiles = new Set(
    sources
      .map((source) => source.filePath)
      .filter(
        (filePath) =>
          CONTRACT_FILE_PATTERN.test(filePath) &&
          isProductionSourceFileGuard({ relativePath: filePath.slice(rootPrefixLength) }),
      ),
  );

  const parsedFiles = sources
    .filter(
      (source) =>
        isContractParseSourceFileGuard({ relativePath: source.filePath.slice(rootPrefixLength) }) &&
        (contractFiles.has(source.filePath) || source.text.includes('ontract')),
    )
    .map((source) => ({
      filePath: source.filePath,
      sourceFile: ts.createSourceFile(
        source.filePath,
        source.text,
        ts.ScriptTarget.Latest,
        true,
        source.filePath.endsWith('x') ? ts.ScriptKind.TSX : ts.ScriptKind.TS,
      ),
    }))
    .map((parsed) => ({ ...parsed, links: moduleLinksReadLayerTransformer(parsed) }));

  const exportedNamesByFile = new Map(
    parsedFiles
      .filter(({ filePath }) => contractFiles.has(filePath))
      .map(
        ({ filePath, sourceFile }) =>
          [
            filePath,
            contractFileExportsReadLayerTransformer({ sourceFile }).exportedConstNames,
          ] as const,
      ),
  );

  const reExportsByFile = new Map(
    parsedFiles
      .filter(({ links }) => links.reExports.length > 0)
      .map(({ filePath, links }) => [filePath, links.reExports] as const),
  );

  const parseSitesByContract = new Map<string, ContractParseSite[]>();
  const nestedInByContract = new Map<string, Set<string>>();

  for (const { filePath, sourceFile, links } of parsedFiles) {
    const bindings = links.imports.flatMap((link) => {
      const targetFile = contractFileFindLayerTransformer({
        specifier: link.specifier,
        fromFile: filePath,
        name: link.importedName,
        contractFiles,
        exportedNamesByFile,
        reExportsByFile,
        knownFiles,
        packages,
      });
      return targetFile === undefined || targetFile === filePath
        ? []
        : [
            contractUsesBindingContract.parse({
              localName: link.localName,
              targetFile,
              isTypeOnly: link.isTypeOnly,
            }),
          ];
    });

    const uses = contractUsesScanLayerTransformer({ sourceFile, bindings });

    for (const { targetFile, site } of uses.parseSites) {
      parseSitesByContract.set(targetFile, [...(parseSitesByContract.get(targetFile) ?? []), site]);
    }

    if (contractFiles.has(filePath)) {
      for (const targetFile of uses.valueTargets) {
        nestedInByContract.set(
          targetFile,
          (nestedInByContract.get(targetFile) ?? new Set<string>()).add(filePath),
        );
      }
    }
  }

  const parsedContracts = new Set(parseSitesByContract.keys());
  for (let changed = true; changed;) {
    changed = false;
    for (const [contractFile, parents] of nestedInByContract) {
      if (
        !parsedContracts.has(contractFile) &&
        [...parents].some((parent) => parsedContracts.has(parent))
      ) {
        parsedContracts.add(contractFile);
        changed = true;
      }
    }
  }

  return parsedFiles
    .filter(({ filePath }) => contractFiles.has(filePath))
    .map(({ filePath, sourceFile }) => {
      const { exportedConstNames, typeExports } = contractFileExportsReadLayerTransformer({
        sourceFile,
      });
      const [owner] = packages
        .filter((candidate) => filePath.startsWith(`${candidate.dir}/`))
        .sort((left, right) => right.dir.length - left.dir.length);
      return contractIndexEntryContract.parse({
        filePath,
        packageName: owner?.name ?? packageNameContract.parse('unknown'),
        isLayer: filePath.endsWith('-layer-contract.ts'),
        exportedContractNames: exportedConstNames,
        typeExports,
        parseSites: parseSitesByContract.get(filePath) ?? [],
        nestedInFiles: [...(nestedInByContract.get(filePath) ?? [])],
        isParsed: parsedContracts.has(filePath),
      });
    });
};
