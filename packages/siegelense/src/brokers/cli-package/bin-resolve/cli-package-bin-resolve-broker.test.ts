import { cliPackageBinResolveBroker } from './cli-package-bin-resolve-broker';
import { cliPackageBinResolveBrokerProxy } from './cli-package-bin-resolve-broker.proxy';

describe('cliPackageBinResolveBroker', () => {
  describe('manifest declares the dungeonmaster bin', () => {
    it('VALID: {@dungeonmaster/cli installed, package.json declares bin.dungeonmaster} => returns the joined absolute path', () => {
      const proxy = cliPackageBinResolveBrokerProxy();
      proxy.manifestDeclaresBin({ binRelative: './dist/bin/dungeonmaster.js' });

      const result = cliPackageBinResolveBroker();

      expect(result).toBe(proxy.getExpectedBinPath({ binRelative: './dist/bin/dungeonmaster.js' }));
    });
  });

  describe('manifest has no bin field', () => {
    it('ERROR: {package.json with no bin.dungeonmaster entry} => throws naming the missing field', () => {
      const proxy = cliPackageBinResolveBrokerProxy();
      proxy.manifestHasNoBinField();

      expect(() => cliPackageBinResolveBroker()).toThrow(/has no "bin\.dungeonmaster" entry$/u);
    });
  });

  describe('package root cannot be found', () => {
    it('ERROR: {no ancestor package.json} => throws naming the package it could not resolve', () => {
      const proxy = cliPackageBinResolveBrokerProxy();
      proxy.packageRootDoesNotExist();

      expect(() => cliPackageBinResolveBroker()).toThrow(
        /^cliPackageBinResolveBroker: no ancestor package\.json found walking up from/u,
      );
    });
  });
});
