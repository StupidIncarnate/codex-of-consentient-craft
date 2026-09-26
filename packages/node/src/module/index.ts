/**
 * PURPOSE: Pass-through for the Node built-in 'module', plus one curated helper. `require`,
 * `require.resolve`, `__dirname` and `__filename` are per-file CommonJS locals and are never
 * re-exported here — a file that needs them keeps using them directly. `resolvePackageRoot` is
 * the one thing that DOES move: locating an installed package's root directory is a real,
 * repeated need (mcp, siegelense, server all walk up from a resolved entry file to find it).
 *
 * `module` declares itself with `export =`, which TypeScript refuses to combine with
 * `export * from`, so this gateway builds a new object whose prototype is the real module
 * namespace (never mutating the real, cached one) and adds `resolvePackageRoot` as its own
 * property — every real member stays reachable through the prototype chain.
 *
 * USAGE:
 * import moduleGateway from '@dungeonmaster/node/module';
 * moduleGateway.createRequire(...);
 * moduleGateway.resolvePackageRoot({ specifier: '@dungeonmaster/shared/contracts' });
 */

import moduleNs = require('module');
import { resolvePackageRoot } from './resolve-package-root';

const gateway = Object.create(moduleNs) as typeof moduleNs & {
  resolvePackageRoot: typeof resolvePackageRoot;
};
gateway.resolvePackageRoot = resolvePackageRoot;

export = gateway;
