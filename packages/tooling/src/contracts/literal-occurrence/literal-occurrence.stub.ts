import { literalOccurrenceContract } from './literal-occurrence-contract';
import type { LiteralOccurrence } from './literal-occurrence-contract';
import type { StubArgument } from '@dungeonmaster/shared/@types';
import { AbsoluteFilePathStub } from '../absolute-file-path/absolute-file-path.stub';

export const LiteralOccurrenceStub = ({
  ...props
}: StubArgument<LiteralOccurrence> = {}): LiteralOccurrence =>
  literalOccurrenceContract.parse({
    filePath: AbsoluteFilePathStub(),
    line: 1,
    column: 0,
    ...props,
  });
