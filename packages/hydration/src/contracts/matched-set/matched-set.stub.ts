import type { StubArgument } from '@dungeonmaster/shared/@types';
import { matchedSetContract } from './matched-set-contract';
import type { MatchedSetData } from './matched-set-contract';

export const MatchedSetStub = ({ ...props }: StubArgument<MatchedSetData> = {}): MatchedSetData =>
  matchedSetContract.parse({
    ingredient: 'operation',
    matchedRef: 'operation[match]',
    ...props,
  });
