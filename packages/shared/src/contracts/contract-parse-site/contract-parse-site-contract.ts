/**
 * PURPOSE: One production line that parses a contract: the file and the 1-based line of the
 * `.parse(` or `.safeParse(` call. Reach for this over a `path:line` string when the caller must
 * read the file and line back apart.
 *
 * USAGE:
 * contractParseSiteContract.parse({ filePath: '/repo/packages/a/src/brokers/x/x-broker.ts', line: 12 });
 * // Returns: ContractParseSite validated object
 */

import { z } from '#gateway/npm/zod';

import { absoluteFilePathContract } from '../absolute-file-path/absolute-file-path-contract';

export const contractParseSiteContract = z.object({
  filePath: absoluteFilePathContract,
  line: z.number().int().min(1).brand<'ContractParseSiteLine'>(),
}).brand<'ContractParseSite'>();

export type ContractParseSite = z.infer<typeof contractParseSiteContract>;
