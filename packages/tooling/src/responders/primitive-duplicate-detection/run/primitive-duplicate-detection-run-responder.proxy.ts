import { duplicateDetectionDetectBrokerProxy } from '../../../brokers/duplicate-detection/detect/duplicate-detection-detect-broker.proxy';
import { PrimitiveDuplicateDetectionRunResponder } from './primitive-duplicate-detection-run-responder';
import { AbsoluteFilePathStub } from '../../../contracts/absolute-file-path/absolute-file-path.stub';
import { GlobPatternStub } from '../../../contracts/glob-pattern/glob-pattern.stub';
import { registerSpyOn } from '@dungeonmaster/testing/register-mock';
import type { SourceCode } from '../../../contracts/source-code/source-code-contract';
import type { GlobPattern } from '../../../contracts/glob-pattern/glob-pattern-contract';
import { processCwdAdapterProxy } from '@dungeonmaster/shared/testing';

export const PrimitiveDuplicateDetectionRunResponderProxy = (): {
  callResponder: typeof PrimitiveDuplicateDetectionRunResponder;
  setupNoDuplicates: (params?: { pattern?: GlobPattern }) => void;
  setupWithSourceCode: (params: { sourceCode: SourceCode; pattern?: GlobPattern }) => void;
  getStdoutOutput: () => readonly unknown[];
} => {
  const brokerProxy = duplicateDetectionDetectBrokerProxy();
  processCwdAdapterProxy();

  // A record-and-swallow spy: the report text is computed at runtime from whatever duplicates the
  // broker returns, so there is no address to key on, and the responder never reads write()'s
  // return value. The `[]` description suppresses the real stdout write; correctness comes from
  // each test asserting the captured calls via getStdoutOutput, not from this description.
  const stdoutWrite = registerSpyOn({ object: process.stdout, method: 'write' });

  stdoutWrite.calledWith([]).returns(true);

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

    getStdoutOutput: (): readonly unknown[] => stdoutWrite.callsMatching([]).map((call) => call[0]),
  };
};
