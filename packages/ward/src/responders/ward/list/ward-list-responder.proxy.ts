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

  const stderrSpy = jest.spyOn(process.stderr, 'write').mockImplementation(() => true);
  const stdoutSpy = jest.spyOn(process.stdout, 'write').mockImplementation(() => true);

  return {
    callResponder: WardListResponder,

    setupWithResult: ({ content }: { content: string }): void => {
      listProxy.setupWithResult({ content });
    },

    setupNoResult: (): void => {
      listProxy.setupNoResult();
    },

    getStderrCalls: (): unknown[] => stderrSpy.mock.calls.map((call) => call[0]),

    getStdoutCalls: (): unknown[] => stdoutSpy.mock.calls.map((call) => call[0]),
  };
};
