import { censusFormatContract } from './census-format-contract';
import type { CensusFormat } from './census-format-contract';

export const CensusFormatStub = (
  { value }: { value: 'table' | 'json' } = { value: 'table' },
): CensusFormat => censusFormatContract.parse(value);
