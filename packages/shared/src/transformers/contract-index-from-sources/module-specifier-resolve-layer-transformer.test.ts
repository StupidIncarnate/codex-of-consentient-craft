import { ContractIndexPackageStub } from '../../contracts/contract-index-package/contract-index-package.stub';
import { ImportPathStub } from '../../contracts/import-path/import-path.stub';
import { moduleSpecifierResolveLayerTransformer } from './module-specifier-resolve-layer-transformer';

const sharedPackage = ContractIndexPackageStub({
  name: '@repo/shared',
  dir: '/repo/packages/shared',
});
const sharedExtraPackage = ContractIndexPackageStub({
  name: '@repo/shared-extra',
  dir: '/repo/packages/shared-extra',
});

describe('moduleSpecifierResolveLayerTransformer', () => {
  describe('relative specifiers', () => {
    it('VALID: {./b from a.ts} => resolves to the sibling .ts file', () => {
      const knownFiles = new Set([
        '/repo/packages/shared/src/b.ts',
      ]);

      const result = moduleSpecifierResolveLayerTransformer({
        specifier: ImportPathStub({ value: './b' }),
        fromFile: '/repo/packages/shared/src/a.ts',
        knownFiles,
        packages: [sharedPackage, sharedExtraPackage],
      });

      expect(result).toBe('/repo/packages/shared/src/b.ts');
    });

    it('VALID: {./b.js from a.ts} => strips the js extension before resolving', () => {
      const knownFiles = new Set([
        '/repo/packages/shared/src/b.ts',
      ]);

      const result = moduleSpecifierResolveLayerTransformer({
        specifier: ImportPathStub({ value: './b.js' }),
        fromFile: '/repo/packages/shared/src/a.ts',
        knownFiles,
        packages: [sharedPackage, sharedExtraPackage],
      });

      expect(result).toBe('/repo/packages/shared/src/b.ts');
    });

    it('VALID: {../dir from a.ts} => resolves to the directory index', () => {
      const knownFiles = new Set([
        '/repo/packages/shared/src/dir/index.ts',
      ]);

      const result = moduleSpecifierResolveLayerTransformer({
        specifier: ImportPathStub({ value: '../dir' }),
        fromFile: '/repo/packages/shared/src/sub/a.ts',
        knownFiles,
        packages: [sharedPackage, sharedExtraPackage],
      });

      expect(result).toBe('/repo/packages/shared/src/dir/index.ts');
    });

    it('EMPTY: {./missing} => returns undefined', () => {
      const result = moduleSpecifierResolveLayerTransformer({
        specifier: ImportPathStub({ value: './missing' }),
        fromFile: '/repo/packages/shared/src/a.ts',
        knownFiles: new Set(),
        packages: [sharedPackage, sharedExtraPackage],
      });

      expect(result).toBe(undefined);
    });
  });

  describe('package specifiers', () => {
    it('VALID: {@repo/shared/contracts} => resolves to the package root barrel', () => {
      const knownFiles = new Set([
        '/repo/packages/shared/contracts.ts',
      ]);

      const result = moduleSpecifierResolveLayerTransformer({
        specifier: ImportPathStub({ value: '@repo/shared/contracts' }),
        fromFile: '/repo/packages/other/src/a.ts',
        knownFiles,
        packages: [sharedPackage, sharedExtraPackage],
      });

      expect(result).toBe('/repo/packages/shared/contracts.ts');
    });

    it('VALID: {@repo/shared-extra/statics} => picks the longest matching package name', () => {
      const knownFiles = new Set([
        '/repo/packages/shared-extra/statics.ts',
      ]);

      const result = moduleSpecifierResolveLayerTransformer({
        specifier: ImportPathStub({ value: '@repo/shared-extra/statics' }),
        fromFile: '/repo/packages/other/src/a.ts',
        knownFiles,
        packages: [sharedPackage, sharedExtraPackage],
      });

      expect(result).toBe('/repo/packages/shared-extra/statics.ts');
    });

    it('VALID: {@repo/shared/brokers subpath under src} => resolves to src/<subpath>/<last>', () => {
      const knownFiles = new Set([
        '/repo/packages/shared/src/brokers/brokers.ts',
      ]);

      const result = moduleSpecifierResolveLayerTransformer({
        specifier: ImportPathStub({ value: '@repo/shared/brokers' }),
        fromFile: '/repo/packages/other/src/a.ts',
        knownFiles,
        packages: [sharedPackage, sharedExtraPackage],
      });

      expect(result).toBe('/repo/packages/shared/src/brokers/brokers.ts');
    });

    it('VALID: {@repo/shared bare} => resolves to src/index', () => {
      const knownFiles = new Set([
        '/repo/packages/shared/src/index.ts',
      ]);

      const result = moduleSpecifierResolveLayerTransformer({
        specifier: ImportPathStub({ value: '@repo/shared' }),
        fromFile: '/repo/packages/other/src/a.ts',
        knownFiles,
        packages: [sharedPackage, sharedExtraPackage],
      });

      expect(result).toBe('/repo/packages/shared/src/index.ts');
    });

    it('EMPTY: {external package} => returns undefined', () => {
      const result = moduleSpecifierResolveLayerTransformer({
        specifier: ImportPathStub({ value: 'zod' }),
        fromFile: '/repo/packages/other/src/a.ts',
        knownFiles: new Set(),
        packages: [sharedPackage, sharedExtraPackage],
      });

      expect(result).toBe(undefined);
    });
  });
});
