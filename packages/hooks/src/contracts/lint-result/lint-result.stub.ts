import type { LintResult } from './lint-result-contract';
import { lintResultContract } from './lint-result-contract';
import { LintMessageStub } from '../lint-message/lint-message.stub';
import type { StubArgument } from '@dungeonmaster/shared/@types';

export const LintResultStub = ({ ...props }: StubArgument<LintResult> = {}): LintResult =>
  lintResultContract.parse({
    filePath: '/test/file.ts',
    messages: [LintMessageStub()],
    errorCount: 1,
    warningCount: 0,
    ...props,
  });
