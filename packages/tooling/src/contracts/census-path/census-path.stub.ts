import { censusPathContract } from './census-path-contract';
import type { CensusPath } from './census-path-contract';

export const CensusPathStub = (
  { value }: { value: string } = {
    value: 'packages/example/src/adapters/fs/read-file/fs-read-file-adapter.ts',
  },
): CensusPath => censusPathContract.parse(value);
