/**
 * PURPOSE: One identifier a file exports on its own (an `export const`/`function`/`class`/`type`/
 * `interface` name, or a local `export { name };`). Standalone so `barrelProvidesNameTransformer`
 * can compare a requested `ImportedName` against a target's own exports without importing the
 * whole `TypescriptModuleShape` contract just for this one field's brand.
 *
 * USAGE:
 * exportedNameContract.parse('userFetchBroker');
 * // Returns branded ExportedName
 */

import { z } from 'zod';

export const exportedNameContract = z.string().min(1).brand<'ExportedName'>();

export type ExportedName = z.infer<typeof exportedNameContract>;
