/**
 * The Jest transformer the PUBLISHED `jest-config-base.js` runs on every `node_modules` `.js`/`.cjs`/
 * `.mjs` file a consumer's test requires: ESM goes through ts-jest, CommonJS comes back untouched.
 *
 * That base sets `transformIgnorePatterns: []` because msw's own transitive graph reaches many
 * ESM-only packages (`rettime`, `@open-draft/deferred-promise`, the `@inquirer/confirm` chain, ...),
 * too many and too volatile to name. So every `node_modules` file is eligible, and this file is what
 * keeps that from costing a ts-jest compile of every large CommonJS dependency: measured in a real
 * packed-and-installed consumer, elkjs's 1.5MB CommonJS `lib/elk-worker.min.js` alone put a cold
 * single-test run of its stub test at ~12s, nearly all of it ts-jest re-emitting a file Node loads
 * as-is.
 *
 * The rule, per file:
 *   - `.mjs` -> ESM; `.cjs` -> CommonJS.
 *   - `.js` whose nearest `package.json` says `"type": "module"` -> ESM.
 *   - any other `.js` -> CommonJS only if V8 compiles it as a CommonJS function body (the shape
 *     Node's own CJS loader wraps it in); any SyntaxError -> ESM. V8's parser, not a regex, so the
 *     word `import` in a string or comment and a dynamic `import()` stay CommonJS, while a static
 *     `import`/`export` or `import.meta` anywhere fails the compile and goes to ts-jest.
 *
 * Errors bias toward ESM on purpose: a false ESM only costs a compile ts-jest already did before
 * this file existed, while a false CommonJS hands raw `import` syntax to Node's CJS loader and fails
 * the test. An unreadable or unparseable `package.json` therefore falls through to the compile check.
 *
 * Plain CJS, loaded by Jest outside ts-jest like its siblings in this folder.
 */
'use strict';

const crypto = require('crypto');
const fs = require('fs');
const path = require('path');
const vm = require('vm');

// Bump when the decision rule changes, so a cached passthrough is never reused under a new rule.
const NODE_MODULES_TRANSFORMER_VERSION = 'node-modules-transformer@1';

const CJS_WRAPPER_PARAMETERS = ['exports', 'require', 'module', '__filename', '__dirname'];

const packageTypeByDirectory = new Map();

const readPackageType = ({ packageJsonPath }) => {
  try {
    const parsed = JSON.parse(fs.readFileSync(packageJsonPath, 'utf8'));
    return parsed !== null && typeof parsed === 'object' && typeof parsed.type === 'string'
      ? parsed.type
      : 'none';
  } catch {
    // Unreadable or invalid JSON says nothing about the module kind; the compile check decides.
    return 'none';
  }
};

const nearestPackageType = ({ directory }) => {
  const cached = packageTypeByDirectory.get(directory);
  if (cached !== undefined) {
    return cached;
  }
  const packageJsonPath = path.join(directory, 'package.json');
  const parent = path.dirname(directory);
  const packageType = fs.existsSync(packageJsonPath)
    ? readPackageType({ packageJsonPath })
    : parent === directory
      ? 'none'
      : nearestPackageType({ directory: parent });
  packageTypeByDirectory.set(directory, packageType);
  return packageType;
};

const compilesAsCommonJs = ({ source }) => {
  // A hashbang is legal at the top of a CJS file but not inside a function body.
  const body = source.replace(/^\uFEFF?#!/u, '//');
  try {
    vm.compileFunction(body, CJS_WRAPPER_PARAMETERS);
    return true;
  } catch {
    // Any SyntaxError (static import/export, import.meta, syntax Node cannot parse) -> ESM.
    return false;
  }
};

/**
 * Returns 'esm' or 'cjs' for one file — see this file's header for the rule.
 */
const nodeModulesModuleKind = ({ source, filePath }) => {
  const extension = path.extname(filePath);
  if (extension === '.mjs') {
    return 'esm';
  }
  if (extension === '.cjs') {
    return 'cjs';
  }
  if (nearestPackageType({ directory: path.dirname(filePath) }) === 'module') {
    return 'esm';
  }
  return compilesAsCommonJs({ source }) ? 'cjs' : 'esm';
};

const passthroughCacheKey = ({ source, filePath }) =>
  crypto
    .createHash('sha256')
    .update(NODE_MODULES_TRANSFORMER_VERSION)
    .update('\0cjs\0')
    .update(filePath)
    .update('\0')
    .update(source)
    .digest('hex');

const createTransformer = (tsJestOptions) => {
  // Resolved here, not at module top, so a test of the decision alone never loads ts-jest.
  const tsJest = require('ts-jest').default.createTransformer(tsJestOptions);

  return {
    getCacheKey: (source, filePath, transformOptions) =>
      nodeModulesModuleKind({ source, filePath }) === 'cjs'
        ? passthroughCacheKey({ source, filePath })
        : `${NODE_MODULES_TRANSFORMER_VERSION}:esm:${tsJest.getCacheKey(source, filePath, transformOptions)}`,
    getCacheKeyAsync: async (source, filePath, transformOptions) =>
      nodeModulesModuleKind({ source, filePath }) === 'cjs'
        ? passthroughCacheKey({ source, filePath })
        : `${NODE_MODULES_TRANSFORMER_VERSION}:esm:${await tsJest.getCacheKeyAsync(source, filePath, transformOptions)}`,
    process: (source, filePath, transformOptions) =>
      nodeModulesModuleKind({ source, filePath }) === 'cjs'
        ? { code: source }
        : tsJest.process(source, filePath, transformOptions),
    processAsync: async (source, filePath, transformOptions) =>
      nodeModulesModuleKind({ source, filePath }) === 'cjs'
        ? { code: source }
        : tsJest.processAsync(source, filePath, transformOptions),
  };
};

module.exports = {
  createTransformer,
  nodeModulesModuleKind,
  NODE_MODULES_TRANSFORMER_VERSION,
};
