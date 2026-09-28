import { censusSourceEntryContract } from './census-source-entry-contract';
import type { CensusSourceEntry } from './census-source-entry-contract';
import type { StubArgument } from '@dungeonmaster/shared/@types';

export const CensusSourceEntryStub = ({
  ...props
}: StubArgument<CensusSourceEntry> = {}): CensusSourceEntry =>
  censusSourceEntryContract.parse({
    file: 'packages/example/src/example.ts',
    text: 'export const example = 1;',
    ...props,
  });
