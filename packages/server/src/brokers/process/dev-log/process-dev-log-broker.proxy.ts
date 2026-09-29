import { deleteEnv, setEnv } from '#gateway/node/process';
import { getEnvProxy } from '#gateway/node/process/get-env/get-env.proxy';
import { stdoutProxy } from '#gateway/node/process/stdout/stdout.proxy';

export const processDevLogBrokerProxy = (): {
  enableVerbose: () => void;
  disableVerbose: () => void;
  getWrittenLines: () => unknown[][];
} => {
  // getEnv has nothing to stage: process.env is a plain object.
  getEnvProxy();
  const stdoutRecorder = stdoutProxy();

  return {
    enableVerbose: (): void => {
      setEnv('VERBOSE', '1');
    },
    disableVerbose: (): void => {
      deleteEnv('VERBOSE');
    },
    // One argument per write, the shape callers compose as RecordedCalls.
    getWrittenLines: (): unknown[][] => stdoutRecorder.getWrites().map((chunk) => [chunk]),
  };
};
