import { censusFileKindContract } from './census-file-kind-contract';
import type { CensusFileKind } from './census-file-kind-contract';

export const CensusFileKindStub = (
  {
    value,
  }: { value: 'production' | 'proxy' | 'test' | 'stub' | 'harness' | 'barrel' | 'other' } = {
    value: 'production',
  },
): CensusFileKind => censusFileKindContract.parse(value);
