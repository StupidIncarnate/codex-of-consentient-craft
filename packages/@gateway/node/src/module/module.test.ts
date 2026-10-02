import {
  createRequire,
  builtinModules,
  resolvePackageRoot,
  dynamicImport,
  resolveModuleIfExists,
} from './module';
import * as pkgModule from 'module';
import { resolvePackageRoot as ourResolvePackageRoot } from './resolve-package-root/resolve-package-root';
import { resolveModuleIfExists as ourResolveModuleIfExists } from './resolve-module-if-exists/resolve-module-if-exists';
import { dynamicImport as ourDynamicImport } from './dynamic-import/dynamic-import';

describe('#gateway/node/module', () => {
  it('VALID: {createRequire} => is the same function module provides', () => {
    expect(createRequire).toBe(pkgModule.createRequire);
  });

  it('VALID: {builtinModules} => is the same array module provides', () => {
    expect(builtinModules).toBe(pkgModule.builtinModules);
  });

  it('VALID: {resolvePackageRoot} => is the same curated function this package exports directly', () => {
    expect(resolvePackageRoot).toBe(ourResolvePackageRoot);
  });

  it('VALID: {dynamicImport} => is the same curated function this package exports directly', () => {
    expect(dynamicImport).toBe(ourDynamicImport);
  });

  it('VALID: {resolveModuleIfExists} => is the same curated function this package exports directly', () => {
    expect(resolveModuleIfExists).toBe(ourResolveModuleIfExists);
  });
});
