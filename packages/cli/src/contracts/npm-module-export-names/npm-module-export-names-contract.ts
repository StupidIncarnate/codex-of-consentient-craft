/**
 * PURPOSE: Every name an `export =` package's declarations let an importer name, split by what the
 * name carries: `values` are runtime bindings (a function, a class, an enum, a property of the
 * exported object), and `types` are names that exist only to the type checker (an interface, a type
 * alias, a namespace holding only types). An `export =` passthrough re-exports each list by name,
 * because TypeScript refuses `export *` against an `export =` module (TS2498).
 *
 * USAGE:
 * npmModuleExportNamesContract.parse({ values: ['act', 'createElement'], types: ['ReactNode'] });
 * // Returns an NpmModuleExportNames
 */

import { z } from '#gateway/npm/zod';

export const npmModuleExportNamesContract = z
  .object({
    values: z.array(z.string().min(1).brand<'NpmModuleExportNamesValues'>()),
    types: z.array(z.string().min(1).brand<'NpmModuleExportNamesTypes'>()),
  })
  .brand<'NpmModuleExportNames'>();

export type NpmModuleExportNames = z.infer<typeof npmModuleExportNamesContract>;
