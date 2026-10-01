/**
 * PURPOSE: Turns one file's name-keyed uses (the parse calls and value mentions of its
 * ContractIndexFileRead) into contract-file-keyed ones, given which contract file each local name
 * landed on. A name with no target drops out; two names landing on one file count once per call.
 * Order follows each target's first name, so the result is what scanning with the targets in hand
 * gives.
 *
 * USAGE:
 * contractUsesResolveLayerTransformer({ filePath, read, targetByLocalName });
 * // Returns { parseSites, wholeParseSites: [{ targetFile, site }], valueTargets }
 */
import { contractParseSiteContract } from '../../contracts/contract-parse-site/contract-parse-site-contract';
import type { ContractIndexFileRead } from '../../contracts/contract-index-file-read/contract-index-file-read-contract';
import { contractUsesScanLayerContract } from '../../contracts/contract-uses-scan-layer/contract-uses-scan-layer-contract';
import type { ContractUsesScanLayer } from '../../contracts/contract-uses-scan-layer/contract-uses-scan-layer-contract';

export const contractUsesResolveLayerTransformer = ({
  filePath,
  read,
  targetByLocalName,
}: {
  filePath: string;
  read: ContractIndexFileRead;
  targetByLocalName: ReadonlyMap<string, string>;
}): ContractUsesScanLayer => {
  const calls = read.parseCalls.map(({ line, parsedNames, wholeNames }) => ({
    site: contractParseSiteContract.parse({ filePath, line }),
    parsedTargets: [...new Set(parsedNames.flatMap((name) => targetByLocalName.get(name) ?? []))],
    wholeTargets: [...new Set(wholeNames.flatMap((name) => targetByLocalName.get(name) ?? []))],
  }));

  return contractUsesScanLayerContract.parse({
    parseSites: calls.flatMap(({ site, parsedTargets }) =>
      parsedTargets.map((targetFile) => ({ targetFile, site })),
    ),
    wholeParseSites: calls.flatMap(({ site, wholeTargets }) =>
      wholeTargets.map((targetFile) => ({ targetFile, site })),
    ),
    valueTargets: [
      ...new Set(read.valueNames.flatMap((name) => targetByLocalName.get(name) ?? [])),
    ],
  });
};
