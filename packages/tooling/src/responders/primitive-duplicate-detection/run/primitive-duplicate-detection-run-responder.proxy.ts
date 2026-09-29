import { duplicateDetectionDetectBrokerProxy } from '../../../brokers/duplicate-detection/detect/duplicate-detection-detect-broker.proxy';
import { PrimitiveDuplicateDetectionRunResponder } from './primitive-duplicate-detection-run-responder';
import { AbsoluteFilePathStub } from '../../../contracts/absolute-file-path/absolute-file-path.stub';
import { GlobPatternStub } from '../../../contracts/glob-pattern/glob-pattern.stub';
import { registerMock } from '@dungeonmaster/testing/register-mock';
import type { SourceCode } from '../../../contracts/source-code/source-code-contract';
import type { GlobPattern } from '../../../contracts/glob-pattern/glob-pattern-contract';
import type { AbsoluteFilePath } from '../../../contracts/absolute-file-path/absolute-file-path-contract';
import { cwd } from '#gateway/node/process';
import { stdoutProxy } from '#gateway/node/process/stdout/stdout.proxy';
import { cwdProxy } from '#gateway/node/process/cwd/cwd.proxy';

// Fixed so the no-`--cwd=`-arg path never depends on the real machine's directory — the
// responder prints this literally on its "Directory:" line, so a test can assert the exact value.
const DEFAULT_CWD = AbsoluteFilePathStub({ value: '/tooling/default-cwd' });

export const PrimitiveDuplicateDetectionRunResponderProxy = (): {
  callResponder: typeof PrimitiveDuplicateDetectionRunResponder;
  setupNoDuplicates: (params?: { pattern?: GlobPattern }) => void;
  setupWithSourceCode: (params: { sourceCode: SourceCode; pattern?: GlobPattern }) => void;
  getStdoutOutput: () => readonly unknown[];
  getDefaultCwd: () => AbsoluteFilePath;
} => {
  const brokerProxy = duplicateDetectionDetectBrokerProxy();
  // #gateway/node/process's own cwdProxy is empty — composed only to satisfy
  // enforce-proxy-child-creation for the `cwd` import above. The real staging happens on the
  // gateway's own `cwd` export directly, addressed by `[]` (its only honest address — it takes no
  // arguments), so every scenario below runs on a fixed value instead of the real OS cwd.
  cwdProxy();
  const cwdHandle = registerMock({ fn: cwd });
  cwdHandle.calledWith([]).returns(String(DEFAULT_CWD));

  const stdoutHandle = stdoutProxy();

  return {
    callResponder: PrimitiveDuplicateDetectionRunResponder,

    setupNoDuplicates: ({ pattern = GlobPatternStub() }: { pattern?: GlobPattern } = {}): void => {
      brokerProxy.setupFiles({ pattern, files: [] });
    },

    setupWithSourceCode: ({
      sourceCode,
      pattern = GlobPatternStub(),
    }: {
      sourceCode: SourceCode;
      pattern?: GlobPattern;
    }): void => {
      brokerProxy.setupFiles({
        pattern,
        files: [{ filePath: AbsoluteFilePathStub(), sourceCode }],
      });
    },

    getStdoutOutput: (): readonly unknown[] => stdoutHandle.getWrites(),

    getDefaultCwd: (): AbsoluteFilePath => DEFAULT_CWD,
  };
};
