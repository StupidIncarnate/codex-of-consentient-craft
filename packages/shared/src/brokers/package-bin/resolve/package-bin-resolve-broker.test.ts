import { execPath } from '#gateway/node/process';

import { packageBinResolveBroker } from './package-bin-resolve-broker';
import { packageBinResolveBrokerProxy } from './package-bin-resolve-broker.proxy';

describe('packageBinResolveBroker', () => {
  describe('the run root has the owning package', () => {
    it('VALID: {binName with a bin map entry} => returns node plus the entry joined onto the package root', async () => {
      const proxy = packageBinResolveBrokerProxy();
      const repoRoot = '/repo/worktrees/quest-a';
      proxy.setupManifestInRunRoot({
        packageName: '@dungeonmaster/ward',
        repoRoot,
        manifestPath: '/repo/worktrees/quest-a/node_modules/@dungeonmaster/ward/package.json',
        rawManifest: JSON.stringify({ bin: { 'dungeonmaster-ward': './dist/bin/ward-entry.js' } }),
      });

      const result = await packageBinResolveBroker({ binName: 'dungeonmaster-ward', repoRoot });

      expect(result).toStrictEqual({
        command: execPath,
        leadingArgs: [
          '/repo/worktrees/quest-a/node_modules/@dungeonmaster/ward/dist/bin/ward-entry.js',
        ],
      });
    });

    it('VALID: {binName, bin declared as one string} => returns node plus that entry', async () => {
      const proxy = packageBinResolveBrokerProxy();
      const repoRoot = '/repo/worktrees/quest-a';
      proxy.setupManifestInRunRoot({
        packageName: '@dungeonmaster/cli',
        repoRoot,
        manifestPath: '/repo/worktrees/quest-a/node_modules/@dungeonmaster/cli/package.json',
        rawManifest: JSON.stringify({ bin: 'dist/bin/dungeonmaster.js' }),
      });

      const result = await packageBinResolveBroker({ binName: 'dungeonmaster', repoRoot });

      expect(result).toStrictEqual({
        command: execPath,
        leadingArgs: [
          '/repo/worktrees/quest-a/node_modules/@dungeonmaster/cli/dist/bin/dungeonmaster.js',
        ],
      });
    });
  });

  describe('only this process own install has the owning package', () => {
    it('VALID: {repoRoot with no node_modules} => returns node plus the own install entry', async () => {
      const proxy = packageBinResolveBrokerProxy();
      const repoRoot = '/consumer/no-modules';
      proxy.setupManifestInOwnInstall({
        packageName: '@dungeonmaster/ward',
        repoRoot,
        manifestPath:
          '/usr/lib/node_modules/dungeonmaster/node_modules/@dungeonmaster/ward/package.json',
        rawManifest: JSON.stringify({ bin: { 'dungeonmaster-ward': './dist/bin/ward-entry.js' } }),
      });

      const result = await packageBinResolveBroker({ binName: 'dungeonmaster-ward', repoRoot });

      expect(result).toStrictEqual({
        command: execPath,
        leadingArgs: [
          '/usr/lib/node_modules/dungeonmaster/node_modules/@dungeonmaster/ward/dist/bin/ward-entry.js',
        ],
      });
    });
  });

  describe('the binary cannot be found', () => {
    it('ERROR: {binName with no statics owner} => throws naming binName and repoRoot', async () => {
      packageBinResolveBrokerProxy();

      await expect(
        packageBinResolveBroker({
          binName: 'rm-rf-everything',
          repoRoot: '/repo/worktrees/quest-a',
        }),
      ).rejects.toThrow(
        /^packageBinResolveBroker: "rm-rf-everything" is not a dungeonmaster binary \(run root \/repo\/worktrees\/quest-a\)$/u,
      );
    });

    it('ERROR: {owning package installed nowhere} => throws naming the package specifier and repoRoot', async () => {
      const proxy = packageBinResolveBrokerProxy();
      const repoRoot = '/repo/worktrees/quest-c';
      proxy.setupPackageInstalledNowhere({ packageName: '@dungeonmaster/ward', repoRoot });

      await expect(
        packageBinResolveBroker({ binName: 'dungeonmaster-ward', repoRoot }),
      ).rejects.toThrow(
        /^moduleResolveBroker: cannot resolve "@dungeonmaster\/ward\/package\.json" from run root \/repo\/worktrees\/quest-c or from this process's own install$/u,
      );
    });

    it('ERROR: {package manifest has no bin} => throws naming binName and repoRoot', async () => {
      const proxy = packageBinResolveBrokerProxy();
      const repoRoot = '/repo/worktrees/quest-d';
      proxy.setupManifestInRunRoot({
        packageName: '@dungeonmaster/ward',
        repoRoot,
        manifestPath: '/repo/worktrees/quest-d/node_modules/@dungeonmaster/ward/package.json',
        rawManifest: JSON.stringify({ name: '@dungeonmaster/ward' }),
      });

      await expect(
        packageBinResolveBroker({ binName: 'dungeonmaster-ward', repoRoot }),
      ).rejects.toThrow(
        /^packageBinResolveBroker: @dungeonmaster\/ward at \/repo\/worktrees\/quest-d\/node_modules\/@dungeonmaster\/ward\/package\.json declares no bin "dungeonmaster-ward" \(run root \/repo\/worktrees\/quest-d\)$/u,
      );
    });

    it('ERROR: {bin map without this binName} => throws naming binName and repoRoot', async () => {
      const proxy = packageBinResolveBrokerProxy();
      const repoRoot = '/repo/worktrees/quest-e';
      proxy.setupManifestInRunRoot({
        packageName: '@dungeonmaster/ward',
        repoRoot,
        manifestPath: '/repo/worktrees/quest-e/node_modules/@dungeonmaster/ward/package.json',
        rawManifest: JSON.stringify({ bin: { 'something-else': './x.js' } }),
      });

      await expect(
        packageBinResolveBroker({ binName: 'dungeonmaster-ward', repoRoot }),
      ).rejects.toThrow(
        /^packageBinResolveBroker: @dungeonmaster\/ward at \/repo\/worktrees\/quest-e\/node_modules\/@dungeonmaster\/ward\/package\.json declares no bin "dungeonmaster-ward" \(run root \/repo\/worktrees\/quest-e\)$/u,
      );
    });
  });
});
