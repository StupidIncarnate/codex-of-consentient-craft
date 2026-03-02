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

  const stderrSpy = jest.spyOn(process.stderr, 'write').mockImplementation(() => true);
  const stdoutSpy = jest.spyOn(process.stdout, 'write').mockImplementation(() => true);

  return {
    callResponder: WardDetailResponder,

    setupWithResult: ({ content }: { content: string }): void => {
      detailProxy.setupWithResult({ content });
    },

    setupNoResult: (): void => {
      detailProxy.setupNoResult();
    },

    getStderrCalls: (): unknown[] => stderrSpy.mock.calls.map((call) => call[0]),

    getStdoutCalls: (): unknown[] => stdoutSpy.mock.calls.map((call) => call[0]),
  };
};
