import { registerSpyOn } from '@dungeonmaster/testing/register-mock';
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

  const stderrSpy = registerSpyOn({ object: process.stderr, method: 'write' });
  stderrSpy.mockImplementation(() => true);
  const stdoutSpy = registerSpyOn({ object: process.stdout, method: 'write' });
  stdoutSpy.mockImplementation(() => true);

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
