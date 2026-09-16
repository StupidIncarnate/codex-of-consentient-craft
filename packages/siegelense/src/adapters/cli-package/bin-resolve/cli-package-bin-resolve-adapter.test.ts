import { cliPackageBinResolveAdapter } from './cli-package-bin-resolve-adapter';
import { cliPackageBinResolveAdapterProxy } from './cli-package-bin-resolve-adapter.proxy';

describe('cliPackageBinResolveAdapter', () => {
  describe('manifest declares the dungeonmaster bin', () => {
    it('VALID: {@dungeonmaster/cli installed, package.json declares bin.dungeonmaster} => returns the joined absolute path', () => {
      const proxy = cliPackageBinResolveAdapterProxy();
      proxy.manifestDeclaresBin({ binRelative: './dist/bin/dungeonmaster.js' });

      const result = cliPackageBinResolveAdapter();

      expect(result).toMatch(/^\/[^\s]+\/dist\/bin\/dungeonmaster\.js$/u);
    });
  });

  describe('manifest has no bin field', () => {
    it('ERROR: {package.json with no bin.dungeonmaster entry} => throws naming the missing field', () => {
      const proxy = cliPackageBinResolveAdapterProxy();
      proxy.manifestHasNoBinField();

      expect(() => cliPackageBinResolveAdapter()).toThrow(/has no "bin\.dungeonmaster" entry$/u);
    });
  });

  describe('package root cannot be found', () => {
    it('ERROR: {no ancestor package.json} => throws naming the package it could not resolve', () => {
      const proxy = cliPackageBinResolveAdapterProxy();
      proxy.packageRootDoesNotExist();

      expect(() => cliPackageBinResolveAdapter()).toThrow(
        /^cliPackageBinResolveAdapter: no ancestor package\.json found walking up from/u,
      );
    });
  });
});
