import { commandRawBrokerProxy } from '../../../brokers/command/raw/command-raw-broker.proxy';
import { WardRawResponder } from './ward-raw-responder';

export const WardRawResponderProxy = (): {
  callResponder: typeof WardRawResponder;
  setupWithResult: (params: { content: string }) => void;
  setupNoResult: () => void;
  getStderrCalls: () => unknown[];
  getStdoutCalls: () => unknown[];
} => {
  const rawProxy = commandRawBrokerProxy();

  const stderrSpy = jest.spyOn(process.stderr, 'write').mockImplementation(() => true);
  const stdoutSpy = jest.spyOn(process.stdout, 'write').mockImplementation(() => true);

  return {
    callResponder: WardRawResponder,

    setupWithResult: ({ content }: { content: string }): void => {
      rawProxy.setupWithResult({ content });
    },

    setupNoResult: (): void => {
      rawProxy.setupNoResult();
    },

    getStderrCalls: (): unknown[] => stderrSpy.mock.calls.map((call) => call[0]),

    getStdoutCalls: (): unknown[] => stdoutSpy.mock.calls.map((call) => call[0]),
  };
};
