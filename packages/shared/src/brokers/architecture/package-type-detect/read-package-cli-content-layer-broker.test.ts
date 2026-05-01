import { AbsoluteFilePathStub } from '../../../contracts/absolute-file-path/absolute-file-path.stub';
import { readPackageCliContentLayerBroker } from './read-package-cli-content-layer-broker';
import { readPackageCliContentLayerBrokerProxy } from './read-package-cli-content-layer-broker.proxy';

const PACKAGE_ROOT = '/repo/packages/pkg';

describe('readPackageCliContentLayerBroker', () => {
  it('VALID: {single non-test startup} => returns its content', () => {
    const proxy = readPackageCliContentLayerBrokerProxy();
    proxy.setupPackage({
      packageRoot: PACKAGE_ROOT,
      startupFiles: { 'start-app.ts': 'export const StartApp = async () => {};' },
    });

    const result = readPackageCliContentLayerBroker({
      packageRoot: AbsoluteFilePathStub({ value: PACKAGE_ROOT }),
    });

    expect(String(result)).toBe('export const StartApp = async () => {};');
  });

  it('VALID: {test files in startup} => excludes them, returns only real source content', () => {
    const proxy = readPackageCliContentLayerBrokerProxy();
    proxy.setupPackage({
      packageRoot: PACKAGE_ROOT,
      startupFiles: {
        'start-app.ts': 'real content',
        'start-app.integration.test.ts': 'test content',
        'start-app.test.ts': 'unit test content',
        'start-app.proxy.ts': 'proxy content',
      },
    });

    const result = readPackageCliContentLayerBroker({
      packageRoot: AbsoluteFilePathStub({ value: PACKAGE_ROOT }),
    });

    expect(String(result)).toBe('real content');
  });

  it('VALID: {multiple non-test startups} => concatenates content with double newline', () => {
    const proxy = readPackageCliContentLayerBrokerProxy();
    proxy.setupPackage({
      packageRoot: PACKAGE_ROOT,
      startupFiles: {
        'start-cli.ts': 'cli body',
        'start-install.ts': 'install body',
      },
    });

    const result = readPackageCliContentLayerBroker({
      packageRoot: AbsoluteFilePathStub({ value: PACKAGE_ROOT }),
    });

    expect(String(result)).toBe('cli body\n\ninstall body');
  });

  it('VALID: {startup + bin both present} => concatenates startup first, then bin', () => {
    const proxy = readPackageCliContentLayerBrokerProxy();
    proxy.setupPackage({
      packageRoot: PACKAGE_ROOT,
      startupFiles: { 'start-cli.ts': 'export const StartCli = () => {};' },
      binFiles: { 'cli-entry.ts': 'process.argv.slice(2)' },
    });

    const result = readPackageCliContentLayerBroker({
      packageRoot: AbsoluteFilePathStub({ value: PACKAGE_ROOT }),
    });

    expect(String(result)).toBe('export const StartCli = () => {};\n\nprocess.argv.slice(2)');
  });

  it('VALID: {bin e2e test file alongside source} => only includes the source file', () => {
    const proxy = readPackageCliContentLayerBrokerProxy();
    proxy.setupPackage({
      packageRoot: PACKAGE_ROOT,
      binFiles: {
        'cli-entry.ts': 'real bin',
        'cli-entry.e2e.test.ts': 'test bin',
      },
    });

    const result = readPackageCliContentLayerBroker({
      packageRoot: AbsoluteFilePathStub({ value: PACKAGE_ROOT }),
    });

    expect(String(result)).toBe('real bin');
  });

  it('EMPTY: {no startup or bin files} => returns undefined', () => {
    const proxy = readPackageCliContentLayerBrokerProxy();
    proxy.setupPackage({ packageRoot: PACKAGE_ROOT });

    const result = readPackageCliContentLayerBroker({
      packageRoot: AbsoluteFilePathStub({ value: PACKAGE_ROOT }),
    });

    expect(result).toBe(undefined);
  });
});
