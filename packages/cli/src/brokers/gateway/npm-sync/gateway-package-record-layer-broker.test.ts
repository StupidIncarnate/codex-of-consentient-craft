import { GatewayNpmDependencyStub } from '../../../contracts/gateway-npm-dependency/gateway-npm-dependency.stub';
import { gatewayPackageRecordLayerBroker } from './gateway-package-record-layer-broker';
import { gatewayPackageRecordLayerBrokerProxy } from './gateway-package-record-layer-broker.proxy';

const NPM_PACKAGE_ROOT = '/repo/packages/@gateway/npm';

describe('gatewayPackageRecordLayerBroker', () => {
  it('VALID: {a new dependency, one already listed at another range} => adds only the new one', async () => {
    const proxy = gatewayPackageRecordLayerBrokerProxy();
    proxy.setupPackageJson({
      npmPackageRoot: NPM_PACKAGE_ROOT,
      packageJson: { name: '@acme/npm', dependencies: { zod: '^3.0.0' }, files: ['dist'] },
    });

    const result = await gatewayPackageRecordLayerBroker({
      npmPackageRoot: NPM_PACKAGE_ROOT,
      dependencies: [
        GatewayNpmDependencyStub({ name: 'zod', range: '^4.0.0', folder: 'zod' }),
        GatewayNpmDependencyStub(),
      ],
    });

    expect(result).toBe(true);
    expect(proxy.writtenPackageJson({ npmPackageRoot: NPM_PACKAGE_ROOT })).toBe(
      `${JSON.stringify(
        {
          name: '@acme/npm',
          dependencies: { 'left-pad': '^1.3.0', zod: '^3.0.0' },
          files: ['dist'],
        },
        null,
        2,
      )}\n`,
    );
  });

  it('VALID: {a new devDependency} => records it in devDependencies, not dependencies', async () => {
    const proxy = gatewayPackageRecordLayerBrokerProxy();
    proxy.setupPackageJson({
      npmPackageRoot: NPM_PACKAGE_ROOT,
      packageJson: { name: '@acme/npm', dependencies: { zod: '^4.0.0' }, files: ['dist'] },
    });

    const result = await gatewayPackageRecordLayerBroker({
      npmPackageRoot: NPM_PACKAGE_ROOT,
      dependencies: [
        GatewayNpmDependencyStub({
          name: 'vitest',
          range: '^3.0.0',
          folder: 'vitest',
          location: 'devDependencies',
        }),
      ],
    });

    expect(result).toBe(true);
    expect(proxy.writtenPackageJson({ npmPackageRoot: NPM_PACKAGE_ROOT })).toBe(
      `${JSON.stringify(
        {
          name: '@acme/npm',
          dependencies: { zod: '^4.0.0' },
          files: ['dist'],
          devDependencies: { vitest: '^3.0.0' },
        },
        null,
        2,
      )}\n`,
    );
  });

  it('VALID: {no dependencies field yet} => creates it', async () => {
    const proxy = gatewayPackageRecordLayerBrokerProxy();
    proxy.setupPackageJson({
      npmPackageRoot: NPM_PACKAGE_ROOT,
      packageJson: { name: '@acme/npm' },
    });

    const result = await gatewayPackageRecordLayerBroker({
      npmPackageRoot: NPM_PACKAGE_ROOT,
      dependencies: [GatewayNpmDependencyStub()],
    });

    expect(result).toBe(true);
    expect(proxy.writtenPackageJson({ npmPackageRoot: NPM_PACKAGE_ROOT })).toBe(
      `${JSON.stringify({ name: '@acme/npm', dependencies: { 'left-pad': '^1.3.0' } }, null, 2)}\n`,
    );
  });

  it('VALID: {additions that sort between and before existing names} => writes dependencies sorted by name', async () => {
    const proxy = gatewayPackageRecordLayerBrokerProxy();
    proxy.setupPackageJson({
      npmPackageRoot: NPM_PACKAGE_ROOT,
      packageJson: { name: '@acme/npm', dependencies: { elkjs: '^0.11.0', zod: '^4.0.0' } },
    });

    await gatewayPackageRecordLayerBroker({
      npmPackageRoot: NPM_PACKAGE_ROOT,
      dependencies: [
        GatewayNpmDependencyStub({ name: 'undici', range: '^7.0.0', folder: 'undici' }),
        GatewayNpmDependencyStub({
          name: '@hono/node-server',
          range: '^1.0.0',
          folder: 'hono__node-server',
        }),
        GatewayNpmDependencyStub({ name: 'ioredis', range: '^5.0.0', folder: 'ioredis' }),
      ],
    });

    expect(proxy.writtenPackageJson({ npmPackageRoot: NPM_PACKAGE_ROOT })).toBe(
      `${JSON.stringify(
        {
          name: '@acme/npm',
          dependencies: {
            '@hono/node-server': '^1.0.0',
            elkjs: '^0.11.0',
            ioredis: '^5.0.0',
            undici: '^7.0.0',
            zod: '^4.0.0',
          },
        },
        null,
        2,
      )}\n`,
    );
  });

  it('EMPTY: {every dependency already listed} => writes nothing and returns false', async () => {
    const proxy = gatewayPackageRecordLayerBrokerProxy();
    proxy.setupPackageJson({
      npmPackageRoot: NPM_PACKAGE_ROOT,
      packageJson: { name: '@acme/npm', dependencies: { 'left-pad': '^1.0.0' } },
    });

    const result = await gatewayPackageRecordLayerBroker({
      npmPackageRoot: NPM_PACKAGE_ROOT,
      dependencies: [GatewayNpmDependencyStub()],
    });

    expect(result).toBe(false);
    expect(proxy.writtenPackageJson({ npmPackageRoot: NPM_PACKAGE_ROOT })).toBe(undefined);
  });
});
