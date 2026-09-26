import { createRequire, builtinModules, resolvePackageRoot, dynamicImport } from './index';
import * as pkgModule from 'module';
import { resolvePackageRoot as ourResolvePackageRoot } from './resolve-package-root';
import { dynamicImport as ourDynamicImport } from './dynamic-import';

describe('@dungeonmaster/node/module', () => {
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
});
