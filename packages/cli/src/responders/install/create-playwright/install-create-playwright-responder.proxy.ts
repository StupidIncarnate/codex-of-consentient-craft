import {
  pathJoinAdapterProxy,
  fsExistsSyncAdapterProxy,
  architecturePackageE2eEligibleDetectBrokerProxy,
} from '@dungeonmaster/shared/testing';
import type { FilePath } from '@dungeonmaster/shared/contracts';
import { fsWriteFileAdapterProxy } from '../../../adapters/fs/write-file/fs-write-file-adapter.proxy';
import { InstallCreatePlaywrightResponder } from './install-create-playwright-responder';

export const InstallCreatePlaywrightResponderProxy = (): {
  callResponder: typeof InstallCreatePlaywrightResponder;
  setupFileExists: (params: { filePath: FilePath }) => void;
  setupFileNotExists: (params: { filePath: FilePath }) => void;
  setupNotE2eEligible: (params: { targetProjectRoot: string }) => void;
  getWrittenFiles: () => readonly { path: unknown; content: unknown }[];
} => {
  pathJoinAdapterProxy();
  const existsProxy = fsExistsSyncAdapterProxy();
  const writeProxy = fsWriteFileAdapterProxy();
  const eligibleProxy = architecturePackageE2eEligibleDetectBrokerProxy();

  const markEligible = ({ targetProjectRoot }: { targetProjectRoot: string }): void => {
    eligibleProxy.setupPackage({
      packageRoot: targetProjectRoot,
      srcDirNames: ['widgets'],
      packageJsonContent: JSON.stringify({ dependencies: { react: '18.2.0' } }),
    });
  };

  return {
    callResponder: InstallCreatePlaywrightResponder,

    setupFileExists: ({ filePath }: { filePath: FilePath }): void => {
      markEligible({ targetProjectRoot: '/project' });
      existsProxy.returns({ filePath, result: true });
    },

    setupFileNotExists: ({ filePath }: { filePath: FilePath }): void => {
      markEligible({ targetProjectRoot: '/project' });
      existsProxy.returns({ filePath, result: false });
      writeProxy.succeeds({ filePath });
    },

    setupNotE2eEligible: ({ targetProjectRoot }: { targetProjectRoot: string }): void => {
      eligibleProxy.setupPackage({ packageRoot: targetProjectRoot, srcDirNames: ['brokers'] });
    },

    getWrittenFiles: (): readonly { path: unknown; content: unknown }[] =>
      writeProxy.getAllWrittenFiles(),
  };
};
