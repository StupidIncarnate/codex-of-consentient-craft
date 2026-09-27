/**
 * PURPOSE: Pass-through for the npm package 'debug'. Code outside the gateway imports debug
 * through here instead of the raw package, so a future guard or override on debug lands in
 * this one file and reaches every caller.
 *
 * `@types/debug`'s root declaration is `export = debug;` — TypeScript hard-refuses `export *`
 * AND `export type *` against any `export =`-typed module (`TS2498`, unconditional), so every
 * value and type this file re-exports is named explicitly rather than passed through with a
 * wildcard. A caller needing a debug export not yet listed here adds one named line.
 *
 * USAGE:
 * import { someExport } from '#gateway/npm/debug';
 */

export { default } from 'debug';
export {
  coerce,
  debug,
  disable,
  enable,
  enabled,
  formatArgs,
  formatters,
  humanize,
  inspectOpts,
  log,
  names,
  selectColor,
  skips,
} from 'debug';
export type { Debugger } from 'debug';
