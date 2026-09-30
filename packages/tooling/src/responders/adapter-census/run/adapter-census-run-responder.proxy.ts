import { stdoutProxy } from '#gateway/node/process/stdout/stdout.proxy';
import { cwdProxy } from '#gateway/node/process/cwd/cwd.proxy';
import { adapterCensusRunBrokerProxy } from '../../../brokers/adapter-census/run/adapter-census-run-broker.proxy';

// Fixed so a run without `--cwd=` never depends on the real machine's directory.
const DEFAULT_CWD = '/census/default-cwd';

export const AdapterCensusRunResponderProxy = (): {
  setupSharedStemRepo: (params: { repoRoot?: string }) => void;
  setupMissingRoot: (params: { repoRoot?: string }) => void;
  getStdoutOutput: () => readonly unknown[];
} => {
  const brokerProxy = adapterCensusRunBrokerProxy();
  const cwdStage = cwdProxy();

  const stdoutHandle = stdoutProxy();

  return {
    setupSharedStemRepo: ({ repoRoot = DEFAULT_CWD }): void => {
      cwdStage.setupCwd({ value: String(DEFAULT_CWD) });
      brokerProxy.setupSharedStemRepo({ repoRoot });
    },
    setupMissingRoot: ({ repoRoot = DEFAULT_CWD }): void => {
      cwdStage.setupCwd({ value: String(DEFAULT_CWD) });
      brokerProxy.setupMissingRoot({ repoRoot });
    },
    getStdoutOutput: (): readonly unknown[] => stdoutHandle.getWrites(),
  };
};
