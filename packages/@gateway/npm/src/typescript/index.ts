/**
 * PURPOSE: Pass-through for the npm package 'typescript'. Code outside the gateway imports typescript
 * through here instead of the raw package, so a future guard or override on typescript lands in
 * this one file and reaches every caller.
 *
 * typescript's own root declaration is `export = ts;`, and TypeScript hard-refuses `export *`
 * AND `export type *` against any `export =`-typed module (`TS2498`, unconditional). Unlike this
 * gateway's other `export =`-typed pass-throughs, this one keeps the `import x = require(...);
 * export = x;` form rather than switching to a named list: `typescript`'s surface is hundreds of
 * functions, enums and interfaces (`ts.SyntaxKind`, `ts.createSourceFile`, …), and this package is
 * never imported by `packages/web` — nothing here ever crosses web's ESM-target typecheck or a
 * Vite/Rollup bundle, so there is no bundler/ESM-target constraint to satisfy, and hand-listing
 * hundreds of names for a constraint that never applies would only add drift risk on every
 * TypeScript upgrade. `import * as ts from '#gateway/npm/typescript'` (ward's own usage) already
 * gets the full namespace through this form, both at the type level and at runtime.
 *
 * USAGE:
 * import { someExport } from '@dungeonmaster/npm/typescript';
 */

import mod = require('typescript');
export = mod;
