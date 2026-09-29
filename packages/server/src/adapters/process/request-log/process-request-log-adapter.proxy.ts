import { registerSpyOn } from '@dungeonmaster/testing/register-mock';
import type { RecordedCalls } from '@dungeonmaster/testing/register-mock';

export const processRequestLogAdapterProxy = (): {
  enableRequestLog: () => void;
  disableRequestLog: () => void;
  getWrittenLines: () => RecordedCalls;
} => {
  const spy = registerSpyOn({ object: process.stdout, method: 'write', passthrough: true });
  // Every write must resolve the same way (true, no real terminal output) no matter what was
  // written — this suppresses the real write, it does not describe an expected call.
  spy.calledWith([]).implement((): boolean => true);

  return {
    enableRequestLog: (): void => {
      process.env.DUNGEONMASTER_REQUEST_LOG = '1';
    },
    disableRequestLog: (): void => {
      Reflect.deleteProperty(process.env, 'DUNGEONMASTER_REQUEST_LOG');
    },
    getWrittenLines: (): RecordedCalls => spy.callsMatching([]),
  };
};
