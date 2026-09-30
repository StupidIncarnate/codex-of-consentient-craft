import { join } from '#gateway/node/path';
import { existsSyncProxy } from '#gateway/node/fs/exists-sync/exists-sync.proxy';
import { ensureDirProxy } from '#gateway/node/fs__promises/ensure-dir/ensure-dir.proxy';
import { writeFileProxy } from '#gateway/node/fs__promises/write-file/write-file.proxy';
import { registerMock, requireActual } from '@dungeonmaster/testing/register-mock';
import { architecturePackageE2eEligibleDetectBrokerProxy } from '@dungeonmaster/shared/brokers/architecture/package-e2e-eligible-detect/architecture-package-e2e-eligible-detect-broker.proxy';
import { InstallCreatePlaywrightResponder } from './install-create-playwright-responder';

export const InstallCreatePlaywrightResponderProxy = (): {
  callResponder: typeof InstallCreatePlaywrightResponder;
  setupFileExists: (params: { filePath: string }) => void;
  setupFileNotExists: (params: { filePath: string }) => void;
  setupNotE2eEligible: (params: { targetProjectRoot: string }) => void;
  getWrittenFiles: () => readonly { path: unknown; content: unknown }[];
  getEnsureDirCallsFor: (params: { path: string }) => readonly unknown[][];
} => {
  const existsProxy = existsSyncProxy();
  const writeProxy = writeFileProxy();
  const ensureDirHandle = ensureDirProxy();
  const eligibleProxy = architecturePackageE2eEligibleDetectBrokerProxy();
  const realPath = requireActual<{ join: typeof join }>({ module: 'path' });
  const joinHandle = registerMock({ fn: join });
  joinHandle.calledWith([]).implement((...segments: never[]) => realPath.join(...segments));
  const writtenPaths: string[] = [];

  const markEligible = ({ targetProjectRoot }: { targetProjectRoot: string }): void => {
    eligibleProxy.setupPackage({
      packageRoot: targetProjectRoot,
      srcDirNames: ['widgets'],
      packageJsonContent: JSON.stringify({ dependencies: { react: '18.2.0' } }),
    });
  };

  return {
    callResponder: InstallCreatePlaywrightResponder,

    setupFileExists: ({ filePath }: { filePath: string }): void => {
      markEligible({ targetProjectRoot: '/project' });
      existsProxy.returns({ path: filePath, exists: true });
    },

    setupFileNotExists: ({ filePath }: { filePath: string }): void => {
      markEligible({ targetProjectRoot: '/project' });
      existsProxy.returns({ path: filePath, exists: false });
      writeProxy.succeeds({ path: filePath });
      writtenPaths.push(filePath);
      ensureDirHandle.succeeds({ path: '/project/src/statics/e2e-unresolvable-token' });
      const staticsPath = '/project/src/statics/e2e-unresolvable-token/e2e-unresolvable-token-statics.ts';
      const staticsTestPath = '/project/src/statics/e2e-unresolvable-token/e2e-unresolvable-token-statics.test.ts';
      writeProxy.succeeds({ path: staticsPath });
      writtenPaths.push(staticsPath);
      writeProxy.succeeds({ path: staticsTestPath });
      writtenPaths.push(staticsTestPath);
    },

    setupNotE2eEligible: ({ targetProjectRoot }: { targetProjectRoot: string }): void => {
      eligibleProxy.setupPackage({ packageRoot: targetProjectRoot, srcDirNames: ['brokers'] });
    },

    getWrittenFiles: (): readonly { path: unknown; content: unknown }[] =>
      writtenPaths.flatMap((path) => {
        const content = writeProxy.writtenContentsFor({ path });
        return content === undefined ? [] : [{ path, content }];
      }),

    getEnsureDirCallsFor: ({ path }: { path: string }): readonly unknown[][] =>
      ensureDirHandle.getCallsFor({ path }),
  };
};
