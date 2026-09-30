import { censusRepoReadLayoutBroker } from './census-repo-read-layout-broker';
import { censusRepoReadLayoutBrokerProxy } from './census-repo-read-layout-broker.proxy';

describe('censusRepoReadLayoutBroker', () => {
  const repoRoot = '/repo';

  it('VALID: {a scoped root and two packages} => the root scope and packages in path order', async () => {
    const proxy = censusRepoReadLayoutBrokerProxy();
    proxy.setupRoot({ repoRoot, rawContents: JSON.stringify({ name: '@acme/root' }) });
    proxy.setupPackages({
      repoRoot,
      packages: [
        { dir: 'packages/web', rawContents: JSON.stringify({ name: '@acme/web', version: '1' }) },
        { dir: 'packages/@gateway/node', rawContents: JSON.stringify({ name: '@acme/node' }) },
      ],
    });

    const result = await censusRepoReadLayoutBroker({ repoRoot });

    expect(result).toStrictEqual({
      scope: '@acme',
      packages: [
        { name: '@acme/node', dir: 'packages/@gateway/node' },
        { name: '@acme/web', dir: 'packages/web' },
      ],
    });
  });

  it('VALID: {an unscoped root name} => the name becomes its own scope', async () => {
    const proxy = censusRepoReadLayoutBrokerProxy();
    proxy.setupRoot({ repoRoot, rawContents: JSON.stringify({ name: 'acme' }) });
    proxy.setupPackages({ repoRoot, packages: [] });

    const result = await censusRepoReadLayoutBroker({ repoRoot });

    expect(result).toStrictEqual({ scope: '@acme', packages: [] });
  });

  it('EMPTY: {a root with no name} => a null scope', async () => {
    const proxy = censusRepoReadLayoutBrokerProxy();
    proxy.setupRoot({ repoRoot, rawContents: JSON.stringify({ private: true }) });
    proxy.setupPackages({ repoRoot, packages: [] });

    const result = await censusRepoReadLayoutBroker({ repoRoot });

    expect(result).toStrictEqual({ scope: null, packages: [] });
  });

  it('EDGE: {a package.json with no name} => that package is left out', async () => {
    const proxy = censusRepoReadLayoutBrokerProxy();
    proxy.setupRoot({ repoRoot, rawContents: JSON.stringify({ name: '@acme/root' }) });
    proxy.setupPackages({
      repoRoot,
      packages: [
        { dir: 'packages/anon', rawContents: JSON.stringify({ private: true }) },
        { dir: 'packages/web', rawContents: JSON.stringify({ name: '@acme/web' }) },
      ],
    });

    const result = await censusRepoReadLayoutBroker({ repoRoot });

    expect(result).toStrictEqual({
      scope: '@acme',
      packages: [{ name: '@acme/web', dir: 'packages/web' }],
    });
  });

  it('ERROR: {no root package.json} => throws with the path in the message', async () => {
    const proxy = censusRepoReadLayoutBrokerProxy();
    proxy.setupMissingRoot({ repoRoot });

    await expect(censusRepoReadLayoutBroker({ repoRoot })).rejects.toThrow(
      /^adapter-census: cannot read \/repo\/package\.json: .*$/u,
    );
  });
});
