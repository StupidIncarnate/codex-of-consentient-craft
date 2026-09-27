import { join } from '#gateway/node/path';
import { PackageNameStub } from '@dungeonmaster/shared/contracts';
import type { FileContents } from '@dungeonmaster/shared/contracts';
import { registerMock, requireActual } from '@dungeonmaster/testing/register-mock';

import { FilePathStub } from '../../../contracts/file-path/file-path.stub';
import { fsReadFileAdapterProxy } from '../../../adapters/fs/read-file/fs-read-file-adapter.proxy';
import { webBundleDistPathAdapter } from '../../../adapters/web-bundle/dist-path/web-bundle-dist-path-adapter';
import { webBundleDistPathAdapterProxy } from '../../../adapters/web-bundle/dist-path/web-bundle-dist-path-adapter.proxy';
import { webBundlePackageResolveBrokerProxy } from '../../web-bundle-package/resolve/web-bundle-package-resolve-broker.proxy';

const WEB_PACKAGE_NAME = '@dungeonmaster/web';

export const webBundleResponseBrokerProxy = (): {
  setupFileContents: (params: { contents: FileContents; expectedRelativePath?: string }) => void;
  setupMissingBundle: () => void;
} => {
  const packageResolveProxy = webBundlePackageResolveBrokerProxy();
  packageResolveProxy.setupOwnDependencies({ dependencyNames: [WEB_PACKAGE_NAME] });
  packageResolveProxy.setupCandidateReact({ candidateName: WEB_PACKAGE_NAME });
  const distPathProxy = webBundleDistPathAdapterProxy();
  const readProxy = fsReadFileAdapterProxy();
  const joinHandle = registerMock({ fn: join });
  const realPath = requireActual<{ join: typeof join }>({ module: 'path' });
  joinHandle.calledWith([]).implement((...segments: never[]) => realPath.join(...segments));

  return {
    setupFileContents: ({
      contents,
      expectedRelativePath,
    }: {
      contents: FileContents;
      expectedRelativePath?: string;
    }): void => {
      if (expectedRelativePath !== undefined) {
        const distPath = webBundleDistPathAdapter({
          packageName: PackageNameStub({ value: WEB_PACKAGE_NAME }),
        });
        if (distPath !== null) {
          const expectedFilepath = FilePathStub({ value: join(distPath, expectedRelativePath) });
          readProxy.returns({ filepath: expectedFilepath, contents });
          return;
        }
      }

      // The real filepath is `${webBundleDistPathAdapter()}/index.html` (or the requested asset
      // path), and webBundleDistPathAdapter resolves a real, environment-dependent path via
      // require.resolve — not something this test can construct. Each test exercises exactly one
      // fsReadFileAdapter call, so a wildcard match carries no pairing risk.
      readProxy.returns({ filepath: () => true, contents });
    },
    setupMissingBundle: (): void => {
      distPathProxy.bundleMissing();
    },
  };
};
