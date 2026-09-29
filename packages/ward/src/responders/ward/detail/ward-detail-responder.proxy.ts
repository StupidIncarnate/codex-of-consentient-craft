import { stderrProxy } from '#gateway/node/process/stderr/stderr.proxy';
import { commandDetailBrokerProxy } from '../../../brokers/command/detail/command-detail-broker.proxy';
import { WardDetailResponder } from './ward-detail-responder';

export const WardDetailResponderProxy = (): {
  callResponder: typeof WardDetailResponder;
  setupWithResult: (params: { content: string }) => void;
  setupNoResult: () => void;
  getStderrCalls: () => unknown[];
  getStdoutCalls: () => unknown[];
} => {
  const detailProxy = commandDetailBrokerProxy();

  const stderr = stderrProxy();

  return {
    callResponder: WardDetailResponder,

    setupWithResult: ({ content }: { content: string }): void => {
      detailProxy.setupWithResult({ content });
    },

    setupNoResult: (): void => {
      detailProxy.setupNoResult();
    },

    getStderrCalls: (): unknown[] => [...stderr.getWrites()],

    getStdoutCalls: (): unknown[] => [...detailProxy.getStdoutCalls()],
  };
};
