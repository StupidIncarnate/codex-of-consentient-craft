/**
 * PURPOSE: What the census reads off one file without resolving anything: the value imports,
 * the re-exports (a barrel's whole job), the names the file defines, and the catch-all staging
 * sites. Resolution across files is a later step, because it needs every file's facts at once.
 *
 * USAGE:
 * sourceFactsContract.parse({ imports: [], reExports: [], exportNames: ['x'], catchAllSites: [] });
 * // Returns: SourceFacts
 */
import { z } from '#gateway/npm/zod';
import { moduleSpecifierContract } from '../module-specifier/module-specifier-contract';
import { exportNameContract } from '../export-name/export-name-contract';
import { catchAllSiteContract } from '../catch-all-site/catch-all-site-contract';

export const sourceFactsContract = z.object({
  imports: z.array(
    z.object({ specifier: moduleSpecifierContract, names: z.array(exportNameContract) }),
  ),
  reExports: z.array(
    z.object({
      specifier: moduleSpecifierContract,
      names: z.array(exportNameContract),
      isStar: z.boolean(),
    }),
  ),
  exportNames: z.array(exportNameContract),
  catchAllSites: z.array(catchAllSiteContract),
});

export type SourceFacts = z.infer<typeof sourceFactsContract>;
