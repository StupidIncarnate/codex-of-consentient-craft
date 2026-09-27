import type { RecordedCalls } from '@dungeonmaster/testing/register-mock';
import type { FilePath } from '@dungeonmaster/shared/contracts';
import { commandRunBrokerProxy } from '../../../brokers/command/run/command-run-broker.proxy';
import { WardRunResponder } from './ward-run-responder';

export const WardRunResponderProxy = (): {
  callResponder: typeof WardRunResponder;
  setupSinglePackagePass: () => void;
  setupSinglePackageLintOnly: () => void;
  setupExistingPath: (params: { filePath: FilePath }) => void;
  setupCompanionTestMissing: (params: { relativePath: string }) => void;
  getExitCalls: () => RecordedCalls;
} => {
  const runProxy = commandRunBrokerProxy();

  return {
    callResponder: WardRunResponder,

    setupSinglePackagePass: (): void => {
      runProxy.setupSinglePackagePass();
    },

    setupSinglePackageLintOnly: (): void => {
      runProxy.setupSinglePackagePass();
    },

    setupExistingPath: ({ filePath }: { filePath: FilePath }): void => {
      runProxy.setupExistingPath({ filePath });
    },

    setupCompanionTestMissing: ({ relativePath }: { relativePath: string }): void => {
      runProxy.setupCompanionTestMissing({ relativePath });
    },

    getExitCalls: (): RecordedCalls => runProxy.getExitCalls(),
  };
};
