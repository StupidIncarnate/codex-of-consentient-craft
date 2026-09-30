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
import { catchAllSiteContract } from '../catch-all-site/catch-all-site-contract';

export const sourceFactsContract = z.object({
  imports: z.array(
    z.object({ specifier: z.string().min(1).brand<'SourceFactsImportsSpecifier'>(), names: z.array(z.string().min(1).brand<'SourceFactsImportsNames'>()) }).brand<'SourceFactsImports'>(),
  ),
  reExports: z.array(
    z.object({
      specifier: z.string().min(1).brand<'SourceFactsReExportsSpecifier'>(),
      names: z.array(z.string().min(1).brand<'SourceFactsReExportsNames'>()),
      isStar: z.boolean(),
    }).brand<'SourceFactsReExports'>(),
  ),
  exportNames: z.array(z.string().min(1).brand<'SourceFactsExportNames'>()),
  catchAllSites: z.array(catchAllSiteContract),
}).brand<'SourceFacts'>();

export type SourceFacts = z.infer<typeof sourceFactsContract>;
