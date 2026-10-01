import { GatewayNpmDependencyStub } from '../../../contracts/gateway-npm-dependency/gateway-npm-dependency.stub';
import { installedVersionLayerBroker } from './installed-version-layer-broker';
import { installedVersionLayerBrokerProxy } from './installed-version-layer-broker.proxy';

const REPO_ROOT = '/repo';
const FROM_DIRECTORY = '/repo/packages/@gateway/npm';

describe('installedVersionLayerBroker', () => {
  it('VALID: {installed at the repo root} => returns its version', async () => {
    const proxy = installedVersionLayerBrokerProxy();
    proxy.setupInstalled({
      repoRoot: REPO_ROOT,
      fromDirectory: FROM_DIRECTORY,
      packageName: 'zod',
      versionsByNodeModules: { '/repo/node_modules': '3.23.8' },
    });

    const result = await installedVersionLayerBroker({
      repoRoot: REPO_ROOT,
      fromDirectory: FROM_DIRECTORY,
      packageName: GatewayNpmDependencyStub({ name: 'zod' }).name,
    });

    expect(result).toBe('3.23.8');
  });

  it('VALID: {a scoped package nested under the gateway and at the root} => returns the nearer one', async () => {
    const proxy = installedVersionLayerBrokerProxy();
    proxy.setupInstalled({
      repoRoot: REPO_ROOT,
      fromDirectory: FROM_DIRECTORY,
      packageName: '@mantine/core',
      versionsByNodeModules: {
        '/repo/packages/@gateway/npm/node_modules': '7.17.0',
        '/repo/node_modules': '8.1.0',
      },
    });

    const result = await installedVersionLayerBroker({
      repoRoot: REPO_ROOT,
      fromDirectory: FROM_DIRECTORY,
      packageName: GatewayNpmDependencyStub({ name: '@mantine/core' }).name,
    });

    expect(result).toBe('7.17.0');
  });

  it('EMPTY: {installed nowhere inside the repo} => returns null', async () => {
    const proxy = installedVersionLayerBrokerProxy();
    proxy.setupInstalled({
      repoRoot: REPO_ROOT,
      fromDirectory: FROM_DIRECTORY,
      packageName: 'zod',
      versionsByNodeModules: {},
    });

    const result = await installedVersionLayerBroker({
      repoRoot: REPO_ROOT,
      fromDirectory: FROM_DIRECTORY,
      packageName: GatewayNpmDependencyStub({ name: 'zod' }).name,
    });

    expect(result).toBe(null);
  });
});
