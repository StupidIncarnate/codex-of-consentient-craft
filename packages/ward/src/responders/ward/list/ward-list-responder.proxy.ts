import { commandListBrokerProxy } from '../../../brokers/command/list/command-list-broker.proxy';
import { WardListResponder } from './ward-list-responder';

export const WardListResponderProxy = (): {
  callResponder: typeof WardListResponder;
  setupWithResult: (params: { content: string }) => void;
  setupNoResult: () => void;
  getStderrCalls: () => unknown[];
  getStdoutCalls: () => unknown[];
} => {
  const listProxy = commandListBrokerProxy();

  return {
    callResponder: WardListResponder,

    setupWithResult: ({ content }: { content: string }): void => {
      listProxy.setupWithResult({ content });
    },

    setupNoResult: (): void => {
      listProxy.setupNoResult();
    },

    getStderrCalls: (): unknown[] => listProxy.getStderrCalls().map((call) => call[0]),

    getStdoutCalls: (): unknown[] => listProxy.getStdoutCalls().map((call) => call[0]),
  };
};
