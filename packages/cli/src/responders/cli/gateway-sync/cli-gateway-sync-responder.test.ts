import { InstallContextStub } from '@dungeonmaster/shared/contracts/install-context/install-context.stub';

import { CliGatewaySyncResponder } from './cli-gateway-sync-responder';
import { CliGatewaySyncResponderProxy } from './cli-gateway-sync-responder.proxy';

describe('CliGatewaySyncResponder', () => {
  it('EMPTY: {repo with no npm gateway package} => prints nothing to do and returns an empty report', async () => {
    const proxy = CliGatewaySyncResponderProxy();
    proxy.setupRepoRootAtStart({ startPath: '/repo' });
    proxy.setupNoGateway({ repoRoot: '/repo' });

    const result = await CliGatewaySyncResponder({
      context: InstallContextStub({
        value: { targetProjectRoot: '/repo', dungeonmasterRoot: '/dm' },
      }),
    });

    expect({ result, output: proxy.getOutput() }).toStrictEqual({
      result: { copied: [], generated: [], untyped: [], esmOnly: [] },
      output: 'gateway-sync: nothing to do\n',
    });
  });

  it('VALID: {started in packages/app, a wrapped and an unwrapped dependency, npm ci} => syncs the repo root found above and prints one line per list', async () => {
    const proxy = CliGatewaySyncResponderProxy();
    proxy.setupRepoRootInParent({ startPath: '/repo/packages/app', repoRoot: '/repo' });
    proxy.setupSync({
      repoRoot: '/repo',
      npmCommand: 'ci',
      rootPackageJson: {
        name: 'acme',
        dependencies: { elkjs: '^0.11.0', 'left-pad': '^1.3.0' },
      },
      consumerFolders: [],
      ownFolders: { elkjs: { 'elkjs.ts': "export * from 'elkjs';\n" } },
      passthroughFolders: [],
    });

    const result = await CliGatewaySyncResponder({
      context: InstallContextStub({
        value: { targetProjectRoot: '/repo/packages/app', dungeonmasterRoot: '/dm' },
      }),
    });

    expect({ result, output: proxy.getOutput() }).toStrictEqual({
      result: { copied: ['elkjs'], generated: ['left-pad'], untyped: ['left-pad'], esmOnly: [] },
      output:
        'gateway-sync: packages/@gateway/npm/src/\n  copied: elkjs\n  generated: left-pad\n  untyped: left-pad\n',
    });
  });

  it('VALID: {every dependency folder already present} => prints nothing to do', async () => {
    const proxy = CliGatewaySyncResponderProxy();
    proxy.setupRepoRootAtStart({ startPath: '/repo' });
    proxy.setupSync({
      repoRoot: '/repo',
      npmCommand: 'install',
      rootPackageJson: { name: 'acme', dependencies: { 'left-pad': '^1.3.0' } },
      consumerFolders: ['left-pad'],
      ownFolders: {},
      passthroughFolders: [],
    });

    const result = await CliGatewaySyncResponder({
      context: InstallContextStub({
        value: { targetProjectRoot: '/repo', dungeonmasterRoot: '/dm' },
      }),
    });

    expect({ result, output: proxy.getOutput() }).toStrictEqual({
      result: { copied: [], generated: [], untyped: [], esmOnly: [] },
      output: 'gateway-sync: nothing to do\n',
    });
  });

  it('ERROR: {no .dungeonmaster.json at or above the start directory} => throws naming the start directory and prints nothing', async () => {
    const proxy = CliGatewaySyncResponderProxy();
    proxy.setupRepoRootNotFound({ startPath: '/elsewhere/app' });
    proxy.setupLifecycleEvent({ value: undefined });

    await expect(
      CliGatewaySyncResponder({
        context: InstallContextStub({
          value: { targetProjectRoot: '/elsewhere/app', dungeonmasterRoot: '/dm' },
        }),
      }),
    ).rejects.toThrow(
      /^gateway-sync found no \.dungeonmaster\.json in \/elsewhere\/app or any folder above it\. Run it inside a repo `dungeonmaster init` has set up\.$/u,
    );
    expect(proxy.getOutput()).toBe('');
  });

  it('ERROR: {no .dungeonmaster.json, started by npm as a different lifecycle script} => still throws', async () => {
    const proxy = CliGatewaySyncResponderProxy();
    proxy.setupRepoRootNotFound({ startPath: '/elsewhere/app' });
    proxy.setupLifecycleEvent({ value: 'prepare' });

    await expect(
      CliGatewaySyncResponder({
        context: InstallContextStub({
          value: { targetProjectRoot: '/elsewhere/app', dungeonmasterRoot: '/dm' },
        }),
      }),
    ).rejects.toThrow(
      /^gateway-sync found no \.dungeonmaster\.json in \/elsewhere\/app or any folder above it\. Run it inside a repo `dungeonmaster init` has set up\.$/u,
    );
    expect(proxy.getOutput()).toBe('');
  });

  it('VALID: {no .dungeonmaster.json, started by npm as the root postinstall} => prints one skip notice and returns an empty report', async () => {
    const proxy = CliGatewaySyncResponderProxy();
    proxy.setupRepoRootNotFound({ startPath: '/elsewhere/app' });
    proxy.setupLifecycleEvent({ value: 'postinstall' });

    const result = await CliGatewaySyncResponder({
      context: InstallContextStub({
        value: { targetProjectRoot: '/elsewhere/app', dungeonmasterRoot: '/dm' },
      }),
    });

    expect({ result, output: proxy.getOutput() }).toStrictEqual({
      result: { copied: [], generated: [], untyped: [], esmOnly: [] },
      output:
        'gateway-sync: skipped, no .dungeonmaster.json in /elsewhere/app or any folder above it\n',
    });
  });

  it('ERROR: {the lockfile install fails} => throws the sync error and prints nothing', async () => {
    const proxy = CliGatewaySyncResponderProxy();
    proxy.setupRepoRootAtStart({ startPath: '/repo' });
    proxy.setupSync({
      repoRoot: '/repo',
      npmCommand: 'install',
      rootPackageJson: { name: 'acme', dependencies: { 'left-pad': '^1.3.0' } },
      consumerFolders: [],
      ownFolders: {},
      passthroughFolders: ['left-pad'],
    });
    proxy.setupInstallFails({ repoRoot: '/repo', output: 'ERESOLVE' });

    await expect(
      CliGatewaySyncResponder({
        context: InstallContextStub({
          value: { targetProjectRoot: '/repo', dungeonmasterRoot: '/dm' },
        }),
      }),
    ).rejects.toThrow(
      /^gateway npm sync: `npm install --ignore-scripts --no-audit --no-fund` in \/repo exited 1:\nERESOLVE$/u,
    );
    expect(proxy.getOutput()).toBe('');
  });
});
