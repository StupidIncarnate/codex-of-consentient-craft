/**
 * PURPOSE: What one source file contributes to the contract index, read from that file alone: its
 * named imports and `export ... from` links, what it exports when it is a contract file, and every
 * parse call and value mention of a name it imports, recorded by local name. Which contract file a
 * name lands on is cross-file, so it is not here — contractIndexFromReadsTransformer resolves it.
 * Reach for this over ContractIndexEntry when one file's share must be kept on its own, as the
 * contract index cache does per file.
 *
 * USAGE:
 * contractIndexFileReadContract.parse({ imports: [], reExports: [], exports: null, parseCalls: [], valueNames: [] });
 * // Returns: ContractIndexFileRead validated object
 */

import { z } from '#gateway/npm/zod';

import { contractIndexEntryContract } from '../contract-index-entry/contract-index-entry-contract';
import { contractParseSiteContract } from '../contract-parse-site/contract-parse-site-contract';

export const contractIndexFileReadContract = z
  .object({
    imports: z.array(
      z
        .object({
          localName: z.string().brand<'ContractIndexFileReadImportsLocalName'>(),
          importedName: z.string().brand<'ContractIndexFileReadImportsImportedName'>(),
          specifier: z.string().brand<'ContractIndexFileReadImportsSpecifier'>(),
          isTypeOnly: z.boolean(),
        })
        .brand<'ContractIndexFileReadImports'>(),
    ),
    reExports: z.array(
      z
        .object({
          kind: z.enum(['star', 'named']),
          exportedName: z.string().brand<'ContractIndexFileReadReExportsExportedName'>(),
          sourceName: z.string().brand<'ContractIndexFileReadReExportsSourceName'>(),
          specifier: z.string().brand<'ContractIndexFileReadReExportsSpecifier'>(),
        })
        .brand<'ContractIndexFileReadReExports'>(),
    ),
    exports: z
      .object({
        exportedContractNames: contractIndexEntryContract.shape.exportedContractNames,
        typeExports: contractIndexEntryContract.shape.typeExports,
      })
      .brand<'ContractIndexFileReadExports'>()
      .nullable(),
    parseCalls: z.array(
      z
        .object({
          line: contractParseSiteContract.shape.line,
          parsedNames: z.array(z.string().brand<'ContractIndexFileReadParseCallsParsedNames'>()),
          wholeNames: z.array(z.string().brand<'ContractIndexFileReadParseCallsWholeNames'>()),
        })
        .brand<'ContractIndexFileReadParseCalls'>(),
    ),
    valueNames: z.array(z.string().brand<'ContractIndexFileReadValueNames'>()),
  })
  .brand<'ContractIndexFileRead'>();

export type ContractIndexFileRead = z.infer<typeof contractIndexFileReadContract>;
