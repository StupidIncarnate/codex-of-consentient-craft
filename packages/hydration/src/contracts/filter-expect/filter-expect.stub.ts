import { filterExpectContract } from './filter-expect-contract';
import type { FilterExpect } from './filter-expect-contract';

export const FilterExpectStub = ({ value }: { value: string } = { value: 'some' }): FilterExpect =>
  filterExpectContract.parse(value);
