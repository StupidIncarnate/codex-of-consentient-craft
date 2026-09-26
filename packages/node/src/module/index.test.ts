import ourModule = require('./index');
import pkgModule = require('module');
import { resolvePackageRoot } from './resolve-package-root';
import { dynamicImport } from './dynamic-import';

describe('@dungeonmaster/node/module', () => {
  it('VALID: {createRequire} => is the same function module provides', () => {
    expect(ourModule.createRequire).toBe(pkgModule.createRequire);
  });

  it('VALID: {builtinModules} => is the same array module provides', () => {
    expect(ourModule.builtinModules).toBe(pkgModule.builtinModules);
  });

  it('VALID: {resolvePackageRoot} => is the same curated function this package exports directly', () => {
    expect(ourModule.resolvePackageRoot).toBe(resolvePackageRoot);
  });

  it('VALID: {dynamicImport} => is the same curated function this package exports directly', () => {
    expect(ourModule.dynamicImport).toBe(dynamicImport);
  });
});
