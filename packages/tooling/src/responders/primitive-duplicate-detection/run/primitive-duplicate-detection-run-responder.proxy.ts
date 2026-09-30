import { duplicateDetectionDetectBrokerProxy } from '../../../brokers/duplicate-detection/detect/duplicate-detection-detect-broker.proxy';
import { PrimitiveDuplicateDetectionRunResponder } from './primitive-duplicate-detection-run-responder';
import { stdoutProxy } from '#gateway/node/process/stdout/stdout.proxy';
import { cwdProxy } from '#gateway/node/process/cwd/cwd.proxy';

// Fixed so the no-`--cwd=`-arg path never depends on the real machine's directory — the
// responder prints this literally on its "Directory:" line, so a test can assert the exact value.
const DEFAULT_CWD = '/tooling/default-cwd';

export const PrimitiveDuplicateDetectionRunResponderProxy = (): {
  callResponder: typeof PrimitiveDuplicateDetectionRunResponder;
  setupNoDuplicates: (params?: { pattern?: string }) => void;
  setupWithSourceCode: (params: { sourceCode: string; pattern?: string }) => void;
  getStdoutOutput: () => readonly unknown[];
  getDefaultCwd: () => string;
} => {
  const brokerProxy = duplicateDetectionDetectBrokerProxy();
  const cwdStage = cwdProxy();

  const stdoutHandle = stdoutProxy();

  return {
    callResponder: PrimitiveDuplicateDetectionRunResponder,

    setupNoDuplicates: ({ pattern = '**/*.ts' }: { pattern?: string } = {}): void => {
      cwdStage.setupCwd({ value: DEFAULT_CWD });
      brokerProxy.setupFiles({ pattern, files: [] });
    },

    setupWithSourceCode: ({
      sourceCode,
      pattern = '**/*.ts',
    }: {
      sourceCode: string;
      pattern?: string;
    }): void => {
      cwdStage.setupCwd({ value: DEFAULT_CWD });
      brokerProxy.setupFiles({
        pattern,
        files: [{ filePath: '/home/user/project/src/file.ts', sourceCode }],
      });
    },

    getStdoutOutput: (): readonly unknown[] => stdoutHandle.getWrites(),

    getDefaultCwd: (): string => DEFAULT_CWD,
  };
};
