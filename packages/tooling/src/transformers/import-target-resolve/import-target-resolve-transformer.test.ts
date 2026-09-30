import { importTargetResolveTransformer } from './import-target-resolve-transformer';
import { CensusPackageStub } from '../../contracts/census-package/census-package.stub';

describe('importTargetResolveTransformer', () => {
  const packages = [
    CensusPackageStub({ name: '@acme/api', dir: 'packages/api' }),
    CensusPackageStub({ name: '@acme/api-extra', dir: 'packages/api-extra' }),
  ];

  describe('relative specifiers', () => {
    it('VALID: {specifier: "../x/x-adapter"} => the sibling file with .ts appended', () => {
      const adapter = 'packages/api/src/adapters/x/x-adapter.ts';

      const result = importTargetResolveTransformer({
        fromFile: 'packages/api/src/brokers/y/y-broker.ts',
        specifier: '../../adapters/x/x-adapter',
        knownFiles: new Set([adapter]),
        packages,
      });

      expect(result).toBe('packages/api/src/adapters/x/x-adapter.ts');
    });

    it('VALID: {specifier: "./x-adapter.js"} => a .js specifier resolves to the .ts file', () => {
      const adapter = 'packages/api/src/adapters/x/x-adapter.ts';

      const result = importTargetResolveTransformer({
        fromFile: 'packages/api/src/adapters/x/x-layer-adapter.ts',
        specifier: './x-adapter.js',
        knownFiles: new Set([adapter]),
        packages,
      });

      expect(result).toBe('packages/api/src/adapters/x/x-adapter.ts');
    });

    it('VALID: {specifier: "./folder"} => a folder resolves to its index file', () => {
      const index = 'packages/api/src/folder/index.ts';

      const result = importTargetResolveTransformer({
        fromFile: 'packages/api/src/main.ts',
        specifier: './folder',
        knownFiles: new Set([index]),
        packages,
      });

      expect(result).toBe('packages/api/src/folder/index.ts');
    });

    it('EMPTY: {specifier: "./missing"} => null when no such file is known', () => {
      const result = importTargetResolveTransformer({
        fromFile: 'packages/api/src/main.ts',
        specifier: './missing',
        knownFiles: new Set(),
        packages,
      });

      expect(result).toBe(null);
    });
  });

  describe('workspace package specifiers', () => {
    it('VALID: {specifier: "@acme/api/adapters"} => the package-root barrel', () => {
      const barrel = 'packages/api/adapters.ts';

      const result = importTargetResolveTransformer({
        fromFile: 'packages/web/src/main.ts',
        specifier: '@acme/api/adapters',
        knownFiles: new Set([barrel]),
        packages,
      });

      expect(result).toBe('packages/api/adapters.ts');
    });

    it('VALID: {specifier: "@acme/api/startup/start-x.proxy"} => the file under src', () => {
      const proxy = 'packages/api/src/startup/start-x.proxy.ts';

      const result = importTargetResolveTransformer({
        fromFile: 'packages/web/src/main.ts',
        specifier: '@acme/api/startup/start-x.proxy',
        knownFiles: new Set([proxy]),
        packages,
      });

      expect(result).toBe('packages/api/src/startup/start-x.proxy.ts');
    });

    it('VALID: {specifier: "@acme/api-extra/adapters"} => the longest package name wins', () => {
      const barrel = 'packages/api-extra/adapters.ts';

      const result = importTargetResolveTransformer({
        fromFile: 'packages/web/src/main.ts',
        specifier: '@acme/api-extra/adapters',
        knownFiles: new Set([barrel]),
        packages,
      });

      expect(result).toBe('packages/api-extra/adapters.ts');
    });

    it('VALID: {specifier: "@acme/api"} => the package main entry', () => {
      const main = 'packages/api/src/index.ts';

      const result = importTargetResolveTransformer({
        fromFile: 'packages/web/src/main.ts',
        specifier: '@acme/api',
        knownFiles: new Set([main]),
        packages,
      });

      expect(result).toBe('packages/api/src/index.ts');
    });
  });

  describe('specifiers naming nothing in the repo', () => {
    it.each(['fs/promises', 'zod', '#gateway/node/fs__promises', '@other/pkg/adapters'])(
      'EMPTY: {specifier: %s} => null',
      (specifier) => {
        const result = importTargetResolveTransformer({
          fromFile: 'packages/api/src/main.ts',
          specifier,
          knownFiles: new Set(['packages/api/adapters.ts']),
          packages,
        });

        expect(result).toBe(null);
      },
    );
  });
});
