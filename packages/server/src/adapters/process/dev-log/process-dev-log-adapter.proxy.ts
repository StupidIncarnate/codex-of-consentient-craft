import { registerSpyOn } from '@dungeonmaster/testing/register-mock';
import type { RecordedCalls } from '@dungeonmaster/testing/register-mock';

export const processDevLogAdapterProxy = (): {
  enableVerbose: () => void;
  disableVerbose: () => void;
  getWrittenLines: () => RecordedCalls;
} => {
  const spy = registerSpyOn({ object: process.stdout, method: 'write', passthrough: true });
  // Every write must resolve the same way (true, no real terminal output) no matter what was
  // written — this suppresses the real write, it does not describe an expected call.
  spy.calledWith([]).implement((): boolean => true);

  return {
    enableVerbose: (): void => {
      process.env.VERBOSE = '1';
    },
    disableVerbose: (): void => {
      Reflect.deleteProperty(process.env, 'VERBOSE');
    },
    getWrittenLines: (): RecordedCalls => spy.callsMatching([]),
  };
};
