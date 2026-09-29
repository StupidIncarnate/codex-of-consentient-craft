/**
 * PURPOSE: One binding name a `named` import or re-export brings in — the identifier a barrel
 * narrowing check matches against a target module's own exports. Standalone so brokers can type a
 * "which names does the caller still want" list without re-deriving the brand `ModuleDependency`
 * already carries on its own `importedNames` field.
 *
 * USAGE:
 * importedNameContract.parse('readFileIfExists');
 * // Returns branded ImportedName
 */

import { z } from '#gateway/npm/zod';

export const importedNameContract = z.string().min(1).brand<'ImportedName'>();

export type ImportedName = z.infer<typeof importedNameContract>;
