/**
 * PURPOSE: Curated subpath for the Node built-in 'module', holding only named re-exports — never a
 * built object, which is what tripped `gateway-colocation`'s purity check on the earlier shape.
 * `require`, `require.resolve`, `__dirname` and `__filename` are per-file CommonJS locals and are
 * never re-exported here — a file that needs them keeps using them directly. `createRequire` and
 * `builtinModules` are the two members of Node's own `module` this repo's code actually reaches
 * for; `resolvePackageRoot` and `dynamicImport` are the curated helpers that move alongside them —
 * locating an installed package's root directory and loading a module dynamically are both real,
 * repeated needs (mcp, siegelense, server, cli all reach for one or the other).
 *
 * USAGE:
 * import { createRequire, resolvePackageRoot } from '#gateway/node/module';
 * resolvePackageRoot({ specifier: '@dungeonmaster/shared/contracts' });
 */

export { createRequire, builtinModules } from 'module';
export { dynamicImport } from './dynamic-import/dynamic-import';
export { resolvePackageRoot } from './resolve-package-root/resolve-package-root';
