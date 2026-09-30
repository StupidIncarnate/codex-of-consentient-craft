/**
 * PURPOSE: Which of the four passthrough barrels an npm package's own type declarations call for —
 * `named` (`export *`), `named-and-default` (`export *` plus the `default`), `export-equals`
 * (`import x = require(); export = x;`), `untyped` when no declaration resolves at all, or
 * `esm-only` when the CommonJS npm gateway cannot `require` the package, so only its types pass.
 *
 * USAGE:
 * npmModuleExportShapeContract.parse('export-equals');
 * // Returns 'export-equals' as NpmModuleExportShape
 */

import { z } from '#gateway/npm/zod';

export const npmModuleExportShapeContract = z.enum([
  'named',
  'named-and-default',
  'export-equals',
  'untyped',
  'esm-only',
]);

export type NpmModuleExportShape = z.infer<typeof npmModuleExportShapeContract>;
