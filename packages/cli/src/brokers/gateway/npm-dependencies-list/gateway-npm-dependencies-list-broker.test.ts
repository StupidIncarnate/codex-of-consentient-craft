import { gatewayNpmDependenciesListBroker } from './gateway-npm-dependencies-list-broker';
import { gatewayNpmDependenciesListBrokerProxy } from './gateway-npm-dependencies-list-broker.proxy';

describe('gatewayNpmDependenciesListBroker', () => {
  it('VALID: {root and workspace dependencies} => unions them, first range winning, and records devDependency location', async () => {
    const proxy = gatewayNpmDependenciesListBrokerProxy();
    proxy.setupRepo({
      repoRoot: '/repo',
      rootPackageJson: {
        name: 'acme',
        dependencies: { zod: '^4.0.0' },
        devDependencies: { 'left-pad': '^1.3.0' },
      },
      workspacePackages: [
        {
          dirName: 'app',
          packageJson: {
            name: '@acme/app',
            dependencies: { zod: '^3.0.0', '@hono/node-server': '^1.0.0' },
            devDependencies: { vitest: '^3.0.0' },
          },
        },
      ],
      gatewayPackages: [],
    });

    const result = await gatewayNpmDependenciesListBroker({ repoRoot: '/repo' });

    expect(result).toStrictEqual([
      { name: 'zod', range: '^4.0.0', folder: 'zod', location: 'dependencies' },
      { name: 'left-pad', range: '^1.3.0', folder: 'left-pad', location: 'devDependencies' },
      {
        name: '@hono/node-server',
        range: '^1.0.0',
        folder: 'hono__node-server',
        location: 'dependencies',
      },
      { name: 'vitest', range: '^3.0.0', folder: 'vitest', location: 'devDependencies' },
    ]);
  });

  it('VALID: {@types/*, dungeonmaster, @dungeonmaster/*, workspace and gateway names} => drops every one', async () => {
    const proxy = gatewayNpmDependenciesListBrokerProxy();
    proxy.setupRepo({
      repoRoot: '/repo',
      rootPackageJson: {
        name: 'acme',
        dependencies: {
          '@types/node': '^24.0.0',
          dungeonmaster: '^0.1.0',
          '@dungeonmaster/testing': '^0.1.0',
          '@acme/app': '*',
          '@acme/npm': '*',
          elkjs: '^0.11.0',
        },
      },
      workspacePackages: [
        {
          dirName: 'app',
          packageJson: { name: '@acme/app', dependencies: { '@acme/node': '*' } },
        },
      ],
      gatewayPackages: [
        { dirName: 'npm', packageJson: { name: '@acme/npm', dependencies: { glob: '^11.0.0' } } },
        { dirName: 'node', packageJson: { name: '@acme/node' } },
      ],
    });

    const result = await gatewayNpmDependenciesListBroker({ repoRoot: '/repo' });

    expect(result).toStrictEqual([
      { name: 'elkjs', range: '^0.11.0', folder: 'elkjs', location: 'dependencies' },
    ]);
  });

  it('EMPTY: {root with no dependency fields, no packages} => returns []', async () => {
    const proxy = gatewayNpmDependenciesListBrokerProxy();
    proxy.setupRepo({
      repoRoot: '/repo',
      rootPackageJson: { name: 'acme' },
      workspacePackages: [],
      gatewayPackages: [],
    });

    const result = await gatewayNpmDependenciesListBroker({ repoRoot: '/repo' });

    expect(result).toStrictEqual([]);
  });
});
