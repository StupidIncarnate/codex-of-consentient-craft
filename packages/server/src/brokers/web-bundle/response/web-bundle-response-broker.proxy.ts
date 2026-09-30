import { readFileProxy } from '#gateway/node/fs__promises/read-file/read-file.proxy';
import { join } from '#gateway/node/path';
import { PackageNameStub } from '@dungeonmaster/shared/contracts/package-name/package-name.stub';
import type { FileContents } from '@dungeonmaster/shared/contracts';
import { registerMock, requireActual } from '@dungeonmaster/testing/register-mock';

import { webBundleDistPathBroker } from '../dist-path/web-bundle-dist-path-broker';
import { webBundleDistPathBrokerProxy } from '../dist-path/web-bundle-dist-path-broker.proxy';
import { webBundlePackageResolveBrokerProxy } from '../../web-bundle-package/resolve/web-bundle-package-resolve-broker.proxy';

const WEB_PACKAGE_NAME = '@dungeonmaster/web';

export const webBundleResponseBrokerProxy = (): {
  setupFileContents: (params: { contents: FileContents; expectedRelativePath: string }) => void;
  setupMissingBundle: () => void;
} => {
  const packageResolveProxy = webBundlePackageResolveBrokerProxy();
  packageResolveProxy.setupOwnDependencies({ dependencyNames: [WEB_PACKAGE_NAME] });
  packageResolveProxy.setupCandidateReact({ candidateName: WEB_PACKAGE_NAME });
  const distPathProxy = webBundleDistPathBrokerProxy();
  const readProxy = readFileProxy();
  const joinHandle = registerMock({ fn: join });
  const realPath = requireActual<{ join: typeof join }>({ module: 'path' });
  joinHandle.calledWith([]).implement((...segments: never[]) => realPath.join(...segments));

  return {
    // expectedRelativePath is the SAME relativePath the broker itself computes from its pathname
    // (isStatic ? pathname : '/index.html') — required, not optional, so every scenario stages the
    // exact filepath readFile will really be called with. webBundleDistPathBroker runs
    // for real (require.resolve against this checkout's own @dungeonmaster/web), the same way the
    // broker resolves it, so distPath here is the real one.
    setupFileContents: ({
      contents,
      expectedRelativePath,
    }: {
      contents: FileContents;
      expectedRelativePath: string;
    }): void => {
      distPathProxy.bundleExists();
      const distPath = webBundleDistPathBroker({
        packageName: PackageNameStub({ value: WEB_PACKAGE_NAME }),
      });
      if (distPath === null) {
        throw new Error(
          'webBundleResponseBrokerProxy.setupFileContents: webBundleDistPathBroker resolved null — is @dungeonmaster/web built?',
        );
      }
      const expectedFilepath = join(distPath, expectedRelativePath);
      readProxy.returns({ path: expectedFilepath, contents });
    },
    setupMissingBundle: (): void => {
      distPathProxy.bundleMissing();
    },
  };
};
