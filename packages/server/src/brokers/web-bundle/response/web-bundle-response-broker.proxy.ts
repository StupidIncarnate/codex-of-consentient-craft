import type { FileContents } from '@dungeonmaster/shared/contracts';
import { pathJoinAdapterProxy } from '@dungeonmaster/shared/testing';

import { fsReadFileAdapterProxy } from '../../../adapters/fs/read-file/fs-read-file-adapter.proxy';
import { webBundleDistPathAdapterProxy } from '../../../adapters/web-bundle/dist-path/web-bundle-dist-path-adapter.proxy';

export const webBundleResponseBrokerProxy = (): {
  setupFileContents: (params: { contents: FileContents }) => void;
  setupMissingBundle: () => void;
} => {
  const distPathProxy = webBundleDistPathAdapterProxy();
  const readProxy = fsReadFileAdapterProxy();
  pathJoinAdapterProxy();

  return {
    setupFileContents: ({ contents }: { contents: FileContents }): void => {
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
