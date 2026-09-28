/**
 * PURPOSE: Pass-through for the Node built-in 'path'. Code outside the gateway imports path
 * through here instead of the raw module, so a future guard or override on path lands in
 * this one file and reaches every caller. `path`'s own types are `export =` only — no named
 * runtime exports exist to `export *` (that form is `node/src/module/module.ts`'s case, TS2498)
 * — so this lists every member by name, the same shape `module.ts` uses. A consumer's tsc
 * program (web's `module: ESNext`) reaches this file's SOURCE directly, where `import mod =
 * require('path'); export = mod;` is TS1202/TS1203 under that target; plain `export {} from`
 * syntax has no such restriction.
 *
 * USAGE:
 * import { someExport } from '#gateway/node/path';
 * import path from '#gateway/node/path'; // path.test.ts pins this to the same object identity
 * // as `import pkgModule from 'path'`, which every `registerMock({ fn: join })` caller relies on.
 */

export { default } from 'path';
export {
  basename,
  delimiter,
  dirname,
  extname,
  format,
  isAbsolute,
  join,
  matchesGlob,
  normalize,
  parse,
  posix,
  relative,
  resolve,
  sep,
  toNamespacedPath,
  win32,
} from 'path';
