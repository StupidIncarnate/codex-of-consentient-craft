import { BundleBuildResultStub } from '../../../contracts/bundle-build-result/bundle-build-result.stub';

import { bundleBuildForIntegrationBroker } from './bundle-build-for-integration-broker';
import { bundleBuildForIntegrationBrokerProxy } from './bundle-build-for-integration-broker.proxy';

const PACKAGE_ROOT = '/repo/packages/cli';

describe('bundleBuildForIntegrationBroker', () => {
  describe('a package that opts in', () => {
    it('VALID: {ward.integrationBuild: true, bundle for these inputs on disk} => returns that bundle directory', async () => {
      const proxy = bundleBuildForIntegrationBrokerProxy();
      proxy.setupOptedInWithCachedBundle({ packageRoot: PACKAGE_ROOT });

      const result = await bundleBuildForIntegrationBroker({ packageRoot: PACKAGE_ROOT });

      expect(result).toStrictEqual(
        BundleBuildResultStub({
          bundleDir: proxy.bundleDirFor({ packageRoot: PACKAGE_ROOT }),
          error: null,
        }),
      );
    });

    it('INVALID: {ward.integrationBuild: true, no build script} => returns an error naming the missing script', async () => {
      const proxy = bundleBuildForIntegrationBrokerProxy();
      proxy.setupManifest({
        packageRoot: PACKAGE_ROOT,
        contents: JSON.stringify({ name: '@scope/cli', ward: { integrationBuild: true } }),
      });

      const result = await bundleBuildForIntegrationBroker({ packageRoot: PACKAGE_ROOT });

      expect(result).toStrictEqual(
        BundleBuildResultStub({
          bundleDir: null,
          error:
            '/repo/packages/cli/package.json sets "ward": { "integrationBuild": true } but has no "build" script. Add a "build" script that accepts --outDir <dir> and writes its whole output there, or remove "integrationBuild".',
        }),
      );
    });
  });

  describe('a package that does not opt in', () => {
    it('VALID: {ward.integrationBuild: false} => returns no bundle and no error', async () => {
      const proxy = bundleBuildForIntegrationBrokerProxy();
      proxy.setupManifest({
        packageRoot: PACKAGE_ROOT,
        contents: JSON.stringify({
          name: '@scope/cli',
          scripts: { build: 'tsc' },
          ward: { integrationBuild: false },
        }),
      });

      const result = await bundleBuildForIntegrationBroker({ packageRoot: PACKAGE_ROOT });

      expect(result).toStrictEqual(BundleBuildResultStub({ bundleDir: null, error: null }));
    });

    it('EMPTY: {no ward key} => returns no bundle and no error', async () => {
      const proxy = bundleBuildForIntegrationBrokerProxy();
      proxy.setupManifest({
        packageRoot: PACKAGE_ROOT,
        contents: JSON.stringify({ name: '@scope/cli', scripts: { build: 'tsc' } }),
      });

      const result = await bundleBuildForIntegrationBroker({ packageRoot: PACKAGE_ROOT });

      expect(result).toStrictEqual(BundleBuildResultStub({ bundleDir: null, error: null }));
    });

    it('EMPTY: {no package.json} => returns no bundle and no error', async () => {
      const proxy = bundleBuildForIntegrationBrokerProxy();
      proxy.setupNoManifest({ packageRoot: PACKAGE_ROOT });

      const result = await bundleBuildForIntegrationBroker({ packageRoot: PACKAGE_ROOT });

      expect(result).toStrictEqual(BundleBuildResultStub({ bundleDir: null, error: null }));
    });

    it('EDGE: {package.json is not JSON} => returns no bundle and no error', async () => {
      const proxy = bundleBuildForIntegrationBrokerProxy();
      proxy.setupManifest({ packageRoot: PACKAGE_ROOT, contents: '{ "name": ' });

      const result = await bundleBuildForIntegrationBroker({ packageRoot: PACKAGE_ROOT });

      expect(result).toStrictEqual(BundleBuildResultStub({ bundleDir: null, error: null }));
    });
  });

  describe('a misspelt setting', () => {
    it('INVALID: {ward: {integrationbuild: true}} => returns an error naming the unknown key', async () => {
      const proxy = bundleBuildForIntegrationBrokerProxy();
      proxy.setupManifest({
        packageRoot: PACKAGE_ROOT,
        contents: JSON.stringify({ name: '@scope/cli', ward: { integrationbuild: true } }),
      });

      const result = await bundleBuildForIntegrationBroker({ packageRoot: PACKAGE_ROOT });

      expect(result).toStrictEqual(
        BundleBuildResultStub({
          bundleDir: null,
          error:
            '/repo/packages/cli/package.json has an invalid "ward" setting (ward: Unrecognized key: "integrationbuild"). The only key ward reads there is "integrationBuild", and it takes true or false.',
        }),
      );
    });
  });
});
