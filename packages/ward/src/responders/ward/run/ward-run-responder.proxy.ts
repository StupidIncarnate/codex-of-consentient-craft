import { commandRunBrokerProxy } from '../../../brokers/command/run/command-run-broker.proxy';
import { WardRunResponder } from './ward-run-responder';

export const WardRunResponderProxy = (): {
  callResponder: typeof WardRunResponder;
  setupSinglePackagePass: () => void;
  setupSinglePackageLintOnly: () => void;
  setupExistingPath: (params: { filePath: string }) => void;
  setupCompanionTestMissing: (params: { relativePath: string }) => void;
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

    setupExistingPath: ({ filePath }: { filePath: string }): void => {
      runProxy.setupExistingPath({ filePath });
    },

    setupCompanionTestMissing: ({ relativePath }: { relativePath: string }): void => {
      runProxy.setupCompanionTestMissing({ relativePath });
    },
  };
};
