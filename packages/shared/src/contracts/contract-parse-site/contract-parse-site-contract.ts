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


export const contractParseSiteContract = z.object({
  filePath: z.string().min(1).refine((path) => { if (path.startsWith('/')) { return true; } if (/^[A-Za-z]:\\/u.test(path)) { return true; } return false; }, { message: 'Path must be absolute (start with / or C:\\ on Windows)', },).brand<'ContractParseSiteFilePath'>(),
  line: z.number().int().min(1).brand<'ContractParseSiteLine'>(),
}).brand<'ContractParseSite'>();

export type ContractParseSite = z.infer<typeof contractParseSiteContract>;
