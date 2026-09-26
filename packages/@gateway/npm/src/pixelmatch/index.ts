/**
 * PURPOSE: Pass-through for the npm package 'pixelmatch'. Code outside the gateway imports pixelmatch
 * through here instead of the raw package, so a future guard or override on pixelmatch lands in
 * this one file and reaches every caller.
 *
 * `@types/pixelmatch`'s root declaration is `export = Pixelmatch;` — TypeScript hard-refuses
 * `export *` AND `export type *` against any `export =`-typed module (`TS2498`, unconditional),
 * so the two types this package declares are named explicitly. pixelmatch's own runtime value has
 * no other enumerable property besides the function itself, so the default is the whole surface.
 *
 * USAGE:
 * import { someExport } from '@dungeonmaster/npm/pixelmatch';
 */

export { default } from 'pixelmatch';
export type { PixelmatchOptions, RGBTuple } from 'pixelmatch';
