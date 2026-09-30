import { literalOccurrenceContract } from './literal-occurrence-contract';
import type { LiteralOccurrence } from './literal-occurrence-contract';
import type { StubArgument } from '@dungeonmaster/shared/@types';

export const LiteralOccurrenceStub = ({
  ...props
}: StubArgument<LiteralOccurrence> = {}): LiteralOccurrence =>
  literalOccurrenceContract.parse({
    filePath: '/home/user/project/src/file.ts',
    line: 1,
    column: 0,
    ...props,
  });
