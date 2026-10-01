/**
 * PURPOSE: Builds the contract index from per-file reads: resolves every imported name to the
 * contract file it lands on (through package barrels), then records which production lines parse
 * each contract and whether it counts as parsed. A contract counts as parsed when production code
 * parses it, or a field of it, or when a contract that counts as parsed uses it as a value (a nested
 * schema); WHOLE parsed on the same terms minus the field parse. `files` lists every source file in
 * scan order; a file whose read is null is known to the resolver but was not parsed. Reach for this
 * over contractIndexFromSourcesTransformer when the per-file reads already exist, such as the files
 * of a contract index cache shard.
 *
 * USAGE:
 * contractIndexFromReadsTransformer({ rootDir, packages, files });
 * // Returns ContractIndexEntry[] — one per `-contract.ts` file under a `contracts/` folder
 */
import { contractUsesBindingContract } from '../../contracts/contract-uses-binding/contract-uses-binding-contract';
import { contractIndexEntryContract } from '../../contracts/contract-index-entry/contract-index-entry-contract';
import type { ContractIndexEntry } from '../../contracts/contract-index-entry/contract-index-entry-contract';
import type { ContractIndexFileRead } from '../../contracts/contract-index-file-read/contract-index-file-read-contract';
import type { ContractIndexPackage } from '../../contracts/contract-index-package/contract-index-package-contract';
import type { ContractParseSite } from '../../contracts/contract-parse-site/contract-parse-site-contract';
import { isContractSourceFileGuard } from '../../guards/is-contract-source-file/is-contract-source-file-guard';
import { contractFileFindLayerTransformer } from './contract-file-find-layer-transformer';
import { contractUsesResolveLayerTransformer } from './contract-uses-resolve-layer-transformer';

export const contractIndexFromReadsTransformer = ({
  rootDir,
  packages,
  files,
}: {
  rootDir: string;
  packages: ContractIndexPackage[];
  files: { filePath: string; read: ContractIndexFileRead | null }[];
}): ContractIndexEntry[] => {
  const knownFiles = new Set(files.map(({ filePath }) => filePath));
  const rootPrefixLength = rootDir.length + 1;

  const contractFiles = new Set(
    files
      .map(({ filePath }) => filePath)
      .filter((filePath) =>
        isContractSourceFileGuard({ relativePath: filePath.slice(rootPrefixLength) }),
      ),
  );

  const parsedFiles = files.flatMap(({ filePath, read }) =>
    read === null ? [] : [{ filePath, read }],
  );

  const exportedNamesByFile = new Map<string, readonly string[]>(
    parsedFiles
      .filter(({ filePath }) => contractFiles.has(filePath))
      .map(({ filePath, read }) => [filePath, read.exports?.exportedContractNames ?? []] as const),
  );

  const reExportsByFile = new Map(
    parsedFiles
      .filter(({ read }) => read.reExports.length > 0)
      .map(({ filePath, read }) => [filePath, read.reExports] as const),
  );

  const resolvedTargets = new Map<string, string | null>();
  const foundTargets = new Map<string, string | null>();
  const parseSitesByContract = new Map<string, ContractParseSite[]>();
  const wholeParseSitesByContract = new Map<string, ContractParseSite[]>();
  const nestedInByContract = new Map<string, Set<string>>();

  for (const { filePath, read } of parsedFiles) {
    const bindings = read.imports.flatMap((link) => {
      const targetFile = contractFileFindLayerTransformer({
        specifier: link.specifier,
        fromFile: filePath,
        name: link.importedName,
        contractFiles,
        exportedNamesByFile,
        reExportsByFile,
        knownFiles,
        packages,
        resolvedTargets,
        foundTargets,
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

    const uses = contractUsesResolveLayerTransformer({
      filePath,
      read,
      targetByLocalName: new Map(
        bindings
          .filter((binding) => !binding.isTypeOnly)
          .map((binding) => [String(binding.localName), String(binding.targetFile)] as const),
      ),
    });

    for (const { targetFile, site } of uses.parseSites) {
      parseSitesByContract.set(targetFile, [...(parseSitesByContract.get(targetFile) ?? []), site]);
    }

    for (const { targetFile, site } of uses.wholeParseSites) {
      wholeParseSitesByContract.set(targetFile, [
        ...(wholeParseSitesByContract.get(targetFile) ?? []),
        site,
      ]);
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
  const wholeParsedContracts = new Set(wholeParseSitesByContract.keys());
  for (const reached of [parsedContracts, wholeParsedContracts]) {
    for (let changed = true; changed;) {
      changed = false;
      for (const [contractFile, parents] of nestedInByContract) {
        if (!reached.has(contractFile) && [...parents].some((parent) => reached.has(parent))) {
          reached.add(contractFile);
          changed = true;
        }
      }
    }
  }

  return parsedFiles
    .filter(({ filePath }) => contractFiles.has(filePath))
    .map(({ filePath, read }) => {
      const [owner] = packages
        .filter((candidate) => filePath.startsWith(`${candidate.dir}/`))
        .sort((left, right) => right.dir.length - left.dir.length);
      return contractIndexEntryContract.parse({
        filePath,
        packageName: owner?.name ?? 'unknown',
        isLayer: filePath.endsWith('-layer-contract.ts'),
        exportedContractNames: read.exports?.exportedContractNames ?? [],
        typeExports: read.exports?.typeExports ?? [],
        parseSites: parseSitesByContract.get(filePath) ?? [],
        wholeParseSites: wholeParseSitesByContract.get(filePath) ?? [],
        nestedInFiles: [...(nestedInByContract.get(filePath) ?? [])],
        isParsed: parsedContracts.has(filePath),
        isWholeParsed: wholeParsedContracts.has(filePath),
      });
    });
};
