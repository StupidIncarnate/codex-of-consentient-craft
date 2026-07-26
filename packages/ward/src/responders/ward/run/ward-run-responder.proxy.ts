import type { RecordedCalls } from '@dungeonmaster/testing/register-mock';
import { commandRunBrokerProxy } from '../../../brokers/command/run/command-run-broker.proxy';
import { WardRunResponder } from './ward-run-responder';

export const WardRunResponderProxy = (): {
  callResponder: typeof WardRunResponder;
  setupSinglePackagePass: () => void;
  setupSinglePackageLintOnly: () => void;
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

    getExitCalls: (): RecordedCalls => runProxy.getExitCalls(),
  };
};
