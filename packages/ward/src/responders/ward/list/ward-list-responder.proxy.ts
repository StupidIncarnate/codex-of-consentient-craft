import { registerSpyOn } from '@dungeonmaster/testing/register-mock';
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

  // write()'s return value never varies by content — what was written is read back via
  // callsMatching below, so the catch-all stays unaddressed.
  const stderrSpy = registerSpyOn({ object: process.stderr, method: 'write' });
  stderrSpy.calledWith([]).returns(true);
  const stdoutSpy = registerSpyOn({ object: process.stdout, method: 'write' });
  stdoutSpy.calledWith([]).returns(true);

  return {
    callResponder: WardListResponder,

    setupWithResult: ({ content }: { content: string }): void => {
      listProxy.setupWithResult({ content });
    },

    setupNoResult: (): void => {
      listProxy.setupNoResult();
    },

    getStderrCalls: (): unknown[] => stderrSpy.callsMatching([]).map((call) => call[0]),

    getStdoutCalls: (): unknown[] => stdoutSpy.callsMatching([]).map((call) => call[0]),
  };
};
