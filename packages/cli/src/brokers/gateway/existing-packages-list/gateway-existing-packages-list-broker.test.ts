import { FilePathStub, FileNameStub } from '@dungeonmaster/shared/contracts';
import { gatewayExistingPackagesListBroker } from './gateway-existing-packages-list-broker';
import { gatewayExistingPackagesListBrokerProxy } from './gateway-existing-packages-list-broker.proxy';

describe('gatewayExistingPackagesListBroker', () => {
  it('EMPTY: {packagesDir: does not exist} => returns an empty list', () => {
    const proxy = gatewayExistingPackagesListBrokerProxy();
    const packagesDir = FilePathStub({ value: '/repo/packages' });
    proxy.setupNoPackagesDir({ packagesDir });

    const result = gatewayExistingPackagesListBroker({ packagesDir });

    expect(result).toStrictEqual([]);
  });

  it('VALID: {packagesDir: two flat packages} => returns both package directories', () => {
    const proxy = gatewayExistingPackagesListBrokerProxy();
    const packagesDir = FilePathStub({ value: '/repo/packages' });

    proxy.setupPackages({
      packagesDir,
      packages: [
        { name: FileNameStub({ value: 'app' }), hasPackageJson: true },
        { name: FileNameStub({ value: 'shared' }), hasPackageJson: true },
      ],
    });

    const result = gatewayExistingPackagesListBroker({ packagesDir });

    expect(result).toStrictEqual(['/repo/packages/app', '/repo/packages/shared']);
  });

  it('VALID: {packagesDir: a flat entry with no package.json} => excludes it', () => {
    const proxy = gatewayExistingPackagesListBrokerProxy();
    const packagesDir = FilePathStub({ value: '/repo/packages' });

    proxy.setupPackages({
      packagesDir,
      packages: [
        { name: FileNameStub({ value: 'app' }), hasPackageJson: true },
        { name: FileNameStub({ value: 'not-a-package' }), hasPackageJson: false },
      ],
    });

    const result = gatewayExistingPackagesListBroker({ packagesDir });

    expect(result).toStrictEqual(['/repo/packages/app']);
  });

  it('VALID: {packagesDir: @gateway group present} => excludes @gateway entirely, without recursing into it', () => {
    const proxy = gatewayExistingPackagesListBrokerProxy();
    const packagesDir = FilePathStub({ value: '/repo/packages' });

    // @gateway is staged as a plain leaf name (no `children`), so if the broker ever tried to
    // recurse into it, the un-staged nested readdir call would throw — proving the exclusion
    // happens BEFORE any attempt to read what is inside it.
    proxy.setupPackages({
      packagesDir,
      packages: [
        { name: FileNameStub({ value: 'app' }), hasPackageJson: true },
        { name: FileNameStub({ value: '@gateway' }), hasPackageJson: true },
      ],
    });

    const result = gatewayExistingPackagesListBroker({ packagesDir });

    expect(result).toStrictEqual(['/repo/packages/app']);
  });

  it('VALID: {packagesDir: a non-gateway @scope group} => recurses into it and returns its children', () => {
    const proxy = gatewayExistingPackagesListBrokerProxy();
    const packagesDir = FilePathStub({ value: '/repo/packages' });

    proxy.setupPackages({
      packagesDir,
      packages: [
        {
          name: FileNameStub({ value: '@acme' }),
          children: [{ name: FileNameStub({ value: 'widgets' }), hasPackageJson: true }],
        },
      ],
    });

    const result = gatewayExistingPackagesListBroker({ packagesDir });

    expect(result).toStrictEqual(['/repo/packages/@acme/widgets']);
  });
});
