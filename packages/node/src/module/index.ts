/**
 * PURPOSE: Pass-through for the Node built-in 'module', plus two curated helpers. `require`,
 * `require.resolve`, `__dirname` and `__filename` are per-file CommonJS locals and are never
 * re-exported here — a file that needs them keeps using them directly. `resolvePackageRoot` and
 * `dynamicImport` are what DOES move: locating an installed package's root directory and loading a
 * module dynamically are both real, repeated needs (mcp, siegelense, server, cli all reach for
 * one or the other).
 *
 * `module` declares itself with `export =`, which TypeScript refuses to combine with
 * `export * from`, so this gateway builds a new object whose prototype is the real module
 * namespace (never mutating the real, cached one) and adds the curated helpers as its own
 * properties — every real member stays reachable through the prototype chain.
 *
 * USAGE:
 * import moduleGateway from '@dungeonmaster/node/module';
 * moduleGateway.createRequire(...);
 * moduleGateway.resolvePackageRoot({ specifier: '@dungeonmaster/shared/contracts' });
 * moduleGateway.dynamicImport({ path: '/abs/path/module.js' });
 */

import moduleNs = require('module');
import { resolvePackageRoot } from './resolve-package-root';
import { dynamicImport } from './dynamic-import';

const gateway = Object.create(moduleNs) as typeof moduleNs & {
  resolvePackageRoot: typeof resolvePackageRoot;
  dynamicImport: typeof dynamicImport;
};
gateway.resolvePackageRoot = resolvePackageRoot;
gateway.dynamicImport = dynamicImport;

export = gateway;
