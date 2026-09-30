/**
 * PURPOSE: One `-contract.ts` file as the repo-wide contract index sees it: what it exports, which
 * production lines parse it, and whether it counts as parsed. Reach for this over reading contract
 * files one at a time when a rule must know what OTHER files do with a contract.
 *
 * USAGE:
 * contractIndexEntryContract.parse({ filePath: '/repo/packages/a/src/contracts/x/x-contract.ts', packageName: '@repo/a', isLayer: false, exportedContractNames: ['xContract'], typeExports: [], parseSites: [], nestedInFiles: [], isParsed: false });
 * // Returns: ContractIndexEntry validated object
 */

import { z } from '#gateway/npm/zod';

import { absoluteFilePathContract } from '../absolute-file-path/absolute-file-path-contract';
import { contractParseSiteContract } from '../contract-parse-site/contract-parse-site-contract';
import { packageNameContract } from '../package-name/package-name-contract';

export const contractIndexEntryContract = z.object({
  filePath: absoluteFilePathContract,
  packageName: packageNameContract,
  isLayer: z.boolean(),
  exportedContractNames: z.array(z.string().brand<'ContractIndexEntryExportedContractNames'>()),
  typeExports: z.array(
    z.object({
      typeName: z.string().brand<'ContractIndexEntryTypeExportsTypeName'>(),
      isSchemaInferred: z.boolean(),
      isExempt: z.boolean(),
    }),
  ),
  parseSites: z.array(contractParseSiteContract),
  nestedInFiles: z.array(absoluteFilePathContract),
  isParsed: z.boolean(),
});

export type ContractIndexEntry = z.infer<typeof contractIndexEntryContract>;
