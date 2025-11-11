import { fsReadFileAdapterProxy } from '../../../adapters/fs/read-file/fs-read-file-adapter.proxy';
import { pathResolveAdapterProxy } from '../../../adapters/path/resolve/path-resolve-adapter.proxy';
import { fsExistsSyncAdapterProxy } from '../../../adapters/fs/exists-sync/fs-exists-sync-adapter.proxy';
import { debugDebugAdapterProxy } from '../../../adapters/debug/debug/debug-debug-adapter.proxy';
import { FileContentsStub } from '../../../contracts/file-contents/file-contents.stub';

export const standardsLoadFilesBrokerProxy = (): {
  setupStandardsLoad: (params: { content: string }) => void;
  setupFileNotFound: () => void;
} => {
  const fsReadFileProxy = fsReadFileAdapterProxy();
  pathResolveAdapterProxy();
  const fsExistsSyncProxy = fsExistsSyncAdapterProxy();
  debugDebugAdapterProxy();

  return {
    setupStandardsLoad: ({ content }: { content: string }) => {
      // Called twice - once for coding-standards.md, once for testing-standards.md
      fsExistsSyncProxy.returns({ exists: true });
      fsExistsSyncProxy.returns({ exists: true });
      fsReadFileProxy.returns({ contents: FileContentsStub({ value: content }) });
      fsReadFileProxy.returns({ contents: FileContentsStub({ value: content }) });
    },
    setupFileNotFound: () => {
      fsExistsSyncProxy.returns({ exists: false });
    },
  };
};
