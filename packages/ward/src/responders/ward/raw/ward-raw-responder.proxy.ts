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
  stderrSpy.calledWith([]).implement(() => true);
  const stdoutSpy = registerSpyOn({ object: process.stdout, method: 'write' });
  stdoutSpy.calledWith([]).implement(() => true);

  return {
    callResponder: WardRawResponder,

    setupWithResult: ({ content }: { content: string }): void => {
      rawProxy.setupWithResult({ content });
    },

    setupNoResult: (): void => {
      rawProxy.setupNoResult();
    },

    getStderrCalls: (): unknown[] => stderrSpy.callsMatching([]).map((call) => call[0]),

    getStdoutCalls: (): unknown[] => stdoutSpy.callsMatching([]).map((call) => call[0]),
  };
};
