import type { FileContents } from '@dungeonmaster/shared/contracts';
import { pathJoinAdapterProxy } from '@dungeonmaster/shared/testing';

import { fsReadFileAdapterProxy } from '../../../adapters/fs/read-file/fs-read-file-adapter.proxy';
import { webBundleDistPathAdapterProxy } from '../../../adapters/web-bundle/dist-path/web-bundle-dist-path-adapter.proxy';
import { FilePathStub } from '../../../contracts/file-path/file-path.stub';

export const webBundleResponseBrokerProxy = (): {
  setupFileContents: (params: { contents: FileContents }) => void;
  setupMissingBundle: () => void;
} => {
  const distPathProxy = webBundleDistPathAdapterProxy();
  const readProxy = fsReadFileAdapterProxy();
  pathJoinAdapterProxy();

  return {
    setupFileContents: ({ contents }: { contents: FileContents }): void => {
      readProxy.returns({ filepath: FilePathStub({ value: '/dist/index.html' }), contents });
    },
    setupMissingBundle: (): void => {
      distPathProxy.bundleMissing();
    },
  };
};
