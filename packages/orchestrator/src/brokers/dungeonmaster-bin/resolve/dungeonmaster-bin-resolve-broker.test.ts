import { execPath } from '#gateway/node/process';

import { dungeonmasterBinResolveBroker } from './dungeonmaster-bin-resolve-broker';
import { dungeonmasterBinResolveBrokerProxy } from './dungeonmaster-bin-resolve-broker.proxy';

const WARD_MANIFEST = JSON.stringify({
  name: '@dungeonmaster/ward',
  bin: { 'dungeonmaster-ward': './dist/bin/ward-entry.js' },
});

describe('dungeonmasterBinResolveBroker', () => {
  it('VALID: {ward installed in the run folder itself} => runs node on that copy entry script', async () => {
    const proxy = dungeonmasterBinResolveBrokerProxy();
    proxy.setupInstalled({
      cwd: '/repo/worktrees/quest-a',
      binName: 'dungeonmaster-ward',
      installedAt: '/repo/worktrees/quest-a',
      manifestJson: WARD_MANIFEST,
    });

    await expect(
      dungeonmasterBinResolveBroker({
        binName: 'dungeonmaster-ward',
        cwd: '/repo/worktrees/quest-a',
      }),
    ).resolves.toStrictEqual({
      command: execPath,
      leadingArgs: [
        '/repo/worktrees/quest-a/node_modules/@dungeonmaster/ward/dist/bin/ward-entry.js',
      ],
    });
  });

  it('VALID: {run folder is a package dir, ward installed at the repo root} => walks up to the nearest copy', async () => {
    const proxy = dungeonmasterBinResolveBrokerProxy();
    proxy.setupInstalled({
      cwd: '/consumer/packages/api',
      binName: 'dungeonmaster-ward',
      installedAt: '/consumer',
      manifestJson: WARD_MANIFEST,
    });

    await expect(
      dungeonmasterBinResolveBroker({
        binName: 'dungeonmaster-ward',
        cwd: '/consumer/packages/api',
      }),
    ).resolves.toStrictEqual({
      command: execPath,
      leadingArgs: ['/consumer/node_modules/@dungeonmaster/ward/dist/bin/ward-entry.js'],
    });
  });

  it('VALID: {cli installed, bin declared as one string} => runs node on that entry script', async () => {
    const proxy = dungeonmasterBinResolveBrokerProxy();
    proxy.setupInstalled({
      cwd: '/repo',
      binName: 'dungeonmaster',
      installedAt: '/repo',
      manifestJson: JSON.stringify({
        name: '@dungeonmaster/cli',
        bin: './dist/bin/dungeonmaster.js',
      }),
    });

    await expect(
      dungeonmasterBinResolveBroker({ binName: 'dungeonmaster', cwd: '/repo' }),
    ).resolves.toStrictEqual({
      command: execPath,
      leadingArgs: ['/repo/node_modules/@dungeonmaster/cli/dist/bin/dungeonmaster.js'],
    });
  });

  it('EMPTY: {nothing installed anywhere up the tree} => falls back to the bare name, for a global-only install', async () => {
    const proxy = dungeonmasterBinResolveBrokerProxy();
    proxy.setupNotInstalled({ cwd: '/consumer/packages/api', binName: 'dungeonmaster-ward' });

    await expect(
      dungeonmasterBinResolveBroker({
        binName: 'dungeonmaster-ward',
        cwd: '/consumer/packages/api',
      }),
    ).resolves.toStrictEqual({ command: 'dungeonmaster-ward', leadingArgs: [] });
  });

  it('EMPTY: {a binary no known package owns} => returns the bare name without reading anything', async () => {
    dungeonmasterBinResolveBrokerProxy();

    await expect(
      dungeonmasterBinResolveBroker({ binName: 'eslint', cwd: '/repo' }),
    ).resolves.toStrictEqual({ command: 'eslint', leadingArgs: [] });
  });
});
