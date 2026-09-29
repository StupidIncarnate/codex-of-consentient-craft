import { registerMock } from '@dungeonmaster/testing/register-mock';
import { cwd } from '#gateway/node/process';
import { stdoutProxy } from '#gateway/node/process/stdout/stdout.proxy';
import { cwdProxy } from '#gateway/node/process/cwd/cwd.proxy';
import { adapterCensusRunBrokerProxy } from '../../../brokers/adapter-census/run/adapter-census-run-broker.proxy';
import { AbsoluteFilePathStub } from '../../../contracts/absolute-file-path/absolute-file-path.stub';
import type { AbsoluteFilePath } from '../../../contracts/absolute-file-path/absolute-file-path-contract';

// Fixed so a run without `--cwd=` never depends on the real machine's directory.
const DEFAULT_CWD = AbsoluteFilePathStub({ value: '/census/default-cwd' });

export const AdapterCensusRunResponderProxy = (): {
  setupSharedStemRepo: (params: { repoRoot?: AbsoluteFilePath }) => void;
  setupMissingRoot: (params: { repoRoot?: AbsoluteFilePath }) => void;
  getStdoutOutput: () => readonly unknown[];
} => {
  const brokerProxy = adapterCensusRunBrokerProxy();
  // `cwdProxy` is empty; the staging goes on the gateway's own `cwd`, whose only honest address
  // is `[]` because it takes no arguments.
  cwdProxy();
  registerMock({ fn: cwd }).calledWith([]).returns(String(DEFAULT_CWD));

  const stdoutHandle = stdoutProxy();

  return {
    setupSharedStemRepo: ({ repoRoot = DEFAULT_CWD }): void => {
      brokerProxy.setupSharedStemRepo({ repoRoot });
    },
    setupMissingRoot: ({ repoRoot = DEFAULT_CWD }): void => {
      brokerProxy.setupMissingRoot({ repoRoot });
    },
    getStdoutOutput: (): readonly unknown[] => stdoutHandle.getWrites(),
  };
};
