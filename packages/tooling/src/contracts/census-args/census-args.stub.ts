import { censusArgsContract } from './census-args-contract';
import type { CensusArgs } from './census-args-contract';
import type { StubArgument } from '@dungeonmaster/shared/@types';

export const CensusArgsStub = ({ ...props }: StubArgument<CensusArgs> = {}): CensusArgs =>
  censusArgsContract.parse({
    format: 'table',
    ...props,
  });
