import { censusCountContract } from './census-count-contract';
import type { CensusCount } from './census-count-contract';

export const CensusCountStub = ({ value }: { value: number } = { value: 0 }): CensusCount =>
  censusCountContract.parse(value);
