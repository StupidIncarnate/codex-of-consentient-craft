import { getEnvProxy } from '#gateway/node/process/get-env/get-env.proxy';
import { stdoutProxy } from '#gateway/node/process/stdout/stdout.proxy';
import { registerSpyOn } from '@dungeonmaster/testing/register-mock';
import type { RecordedCalls } from '@dungeonmaster/testing/register-mock';

export const processDevLogBrokerProxy = (): {
  enableVerbose: () => void;
  disableVerbose: () => void;
  getWrittenLines: () => RecordedCalls;
} => {
  // Neither getEnv nor stdout has an npm dependency to mock (see each one's own header) — composing
  // both here is what the proxy-child-creation rule expects of every implementation import, not a
  // stage this test needs.
  getEnvProxy();
  stdoutProxy();
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
