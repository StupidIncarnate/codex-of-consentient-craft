import { join } from '#gateway/node/path';
import { existsSyncProxy } from '#gateway/node/fs/exists-sync/exists-sync.proxy';
import { ensureDirProxy } from '#gateway/node/fs__promises/ensure-dir/ensure-dir.proxy';
import { registerMock, requireActual } from '@dungeonmaster/testing/register-mock';
import { architecturePackageE2eEligibleDetectBrokerProxy } from '@dungeonmaster/shared/testing';
import { FilePathStub } from '@dungeonmaster/shared/contracts';
import type { FilePath } from '@dungeonmaster/shared/contracts';
import { fsWriteFileAdapterProxy } from '../../../adapters/fs/write-file/fs-write-file-adapter.proxy';
import { InstallCreatePlaywrightResponder } from './install-create-playwright-responder';

export const InstallCreatePlaywrightResponderProxy = (): {
  callResponder: typeof InstallCreatePlaywrightResponder;
  setupFileExists: (params: { filePath: FilePath }) => void;
  setupFileNotExists: (params: { filePath: FilePath }) => void;
  setupNotE2eEligible: (params: { targetProjectRoot: string }) => void;
  getWrittenFiles: () => readonly { path: unknown; content: unknown }[];
  getEnsureDirCallsFor: (params: { path: string }) => readonly unknown[][];
} => {
  const existsProxy = existsSyncProxy();
  const writeProxy = fsWriteFileAdapterProxy();
  const ensureDirHandle = ensureDirProxy();
  const eligibleProxy = architecturePackageE2eEligibleDetectBrokerProxy();
  const realPath = requireActual<{ join: typeof join }>({ module: 'path' });
  const joinHandle = registerMock({ fn: join });
  joinHandle.calledWith([]).implement((...segments: never[]) => realPath.join(...segments));

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
      existsProxy.returns({ path: filePath, exists: true });
    },

    setupFileNotExists: ({ filePath }: { filePath: FilePath }): void => {
      markEligible({ targetProjectRoot: '/project' });
      existsProxy.returns({ path: filePath, exists: false });
      writeProxy.succeeds({ filePath });
      ensureDirHandle.succeeds({ path: '/project/src/statics/e2e-unresolvable-token' });
      writeProxy.succeeds({
        filePath: FilePathStub({
          value: '/project/src/statics/e2e-unresolvable-token/e2e-unresolvable-token-statics.ts',
        }),
      });
      writeProxy.succeeds({
        filePath: FilePathStub({
          value:
            '/project/src/statics/e2e-unresolvable-token/e2e-unresolvable-token-statics.test.ts',
        }),
      });
    },

    setupNotE2eEligible: ({ targetProjectRoot }: { targetProjectRoot: string }): void => {
      eligibleProxy.setupPackage({ packageRoot: targetProjectRoot, srcDirNames: ['brokers'] });
    },

    getWrittenFiles: (): readonly { path: unknown; content: unknown }[] =>
      writeProxy.getAllWrittenFiles(),

    getEnsureDirCallsFor: ({ path }: { path: string }): readonly unknown[][] =>
      ensureDirHandle.getCallsFor({ path }),
  };
};
