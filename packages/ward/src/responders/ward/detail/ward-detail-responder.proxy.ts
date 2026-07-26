import { registerSpyOn } from '@dungeonmaster/testing/register-mock';
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

  // write()'s return value never varies by content — what was written is read back via
  // callsMatching below, so the catch-all stays unaddressed.
  const stderrSpy = registerSpyOn({ object: process.stderr, method: 'write' });
  stderrSpy.calledWith([]).returns(true);
  const stdoutSpy = registerSpyOn({ object: process.stdout, method: 'write' });
  stdoutSpy.calledWith([]).returns(true);

  return {
    callResponder: WardDetailResponder,

    setupWithResult: ({ content }: { content: string }): void => {
      detailProxy.setupWithResult({ content });
    },

    setupNoResult: (): void => {
      detailProxy.setupNoResult();
    },

    getStderrCalls: (): unknown[] => stderrSpy.callsMatching([]).map((call) => call[0]),

    getStdoutCalls: (): unknown[] => stdoutSpy.callsMatching([]).map((call) => call[0]),
  };
};
