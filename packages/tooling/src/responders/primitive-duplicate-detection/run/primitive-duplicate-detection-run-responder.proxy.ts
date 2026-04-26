import { duplicateDetectionDetectBrokerProxy } from '../../../brokers/duplicate-detection/detect/duplicate-detection-detect-broker.proxy';
import { PrimitiveDuplicateDetectionRunResponder } from './primitive-duplicate-detection-run-responder';
import { AbsoluteFilePathStub } from '../../../contracts/absolute-file-path/absolute-file-path.stub';
import { GlobPatternStub } from '../../../contracts/glob-pattern/glob-pattern.stub';
import { registerSpyOn } from '@dungeonmaster/testing/register-mock';
import type { SourceCode } from '../../../contracts/source-code/source-code-contract';
import { processCwdAdapterProxy } from '@dungeonmaster/shared/testing';

export const PrimitiveDuplicateDetectionRunResponderProxy = (): {
  callResponder: typeof PrimitiveDuplicateDetectionRunResponder;
  setupNoDuplicates: () => void;
  setupWithSourceCode: (params: { sourceCode: SourceCode }) => void;
  getStdoutOutput: () => readonly unknown[];
} => {
  const brokerProxy = duplicateDetectionDetectBrokerProxy();
  processCwdAdapterProxy();
  const writes: unknown[] = [];

  registerSpyOn({ object: process.stdout, method: 'write' }).mockImplementation(
    (chunk: unknown) => {
      writes.push(chunk);
      return true;
    },
  );

  return {
    callResponder: PrimitiveDuplicateDetectionRunResponder,

    setupNoDuplicates: (): void => {
      brokerProxy.setupFiles({ pattern: GlobPatternStub(), files: [] });
    },

    setupWithSourceCode: ({ sourceCode }: { sourceCode: SourceCode }): void => {
      brokerProxy.setupFiles({
        pattern: GlobPatternStub(),
        files: [{ filePath: AbsoluteFilePathStub(), sourceCode }],
      });
    },

    getStdoutOutput: (): readonly unknown[] => writes,
  };
};
