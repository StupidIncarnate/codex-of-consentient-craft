/**
 * PURPOSE: One `-contract.ts` file as the repo-wide contract index sees it: what it exports, which
 * production lines parse it, and whether it counts as parsed. Reach for this over reading contract
 * files one at a time when a rule must know what OTHER files do with a contract.
 *
 * USAGE:
 * contractIndexEntryContract.parse({ filePath: '/repo/packages/a/src/contracts/x/x-contract.ts', packageName: '@repo/a', isLayer: false, exportedContractNames: ['xContract'], typeExports: [], parseSites: [], wholeParseSites: [], nestedInFiles: [], isParsed: false, isWholeParsed: false });
 * // Returns: ContractIndexEntry validated object
 */

import { z } from '#gateway/npm/zod';

import { contractParseSiteContract } from '../contract-parse-site/contract-parse-site-contract';

export const contractIndexEntryContract = z
  .object({
    filePath: z
      .string()
      .min(1)
      .refine(
        (path) => {
          if (path.startsWith('/')) {
            return true;
          }
          if (/^[A-Za-z]:\\/u.test(path)) {
            return true;
          }
          return false;
        },
        { message: 'Path must be absolute (start with / or C:\\ on Windows)' },
      )
      .brand<'ContractIndexEntryFilePath'>(),
    packageName: z.string().min(1).brand<'ContractIndexEntryPackageName'>(),
    isLayer: z.boolean(),
    exportedContractNames: z.array(z.string().brand<'ContractIndexEntryExportedContractNames'>()),
    typeExports: z.array(
      z
        .object({
          typeName: z.string().brand<'ContractIndexEntryTypeExportsTypeName'>(),
          isSchemaInferred: z.boolean(),
          isExempt: z.boolean(),
        })
        .brand<'ContractIndexEntryTypeExports'>(),
    ),
    parseSites: z.array(contractParseSiteContract),
    wholeParseSites: z.array(contractParseSiteContract),
    nestedInFiles: z.array(
      z
        .string()
        .min(1)
        .refine(
          (path) => {
            if (path.startsWith('/')) {
              return true;
            }
            if (/^[A-Za-z]:\\/u.test(path)) {
              return true;
            }
            return false;
          },
          { message: 'Path must be absolute (start with / or C:\\ on Windows)' },
        )
        .brand<'ContractIndexEntryNestedInFiles'>(),
    ),
    isParsed: z.boolean(),
    isWholeParsed: z.boolean(),
  })
  .brand<'ContractIndexEntry'>();

export type ContractIndexEntry = z.infer<typeof contractIndexEntryContract>;
