import type { StubArgument } from '@dungeonmaster/shared/@types';
import { runFiltersContract, type RunFilters } from './run-filters-contract';

export const RunFiltersStub = ({ ...props }: StubArgument<RunFilters> = {}): RunFilters =>
  runFiltersContract.parse({
    ...props,
  });
