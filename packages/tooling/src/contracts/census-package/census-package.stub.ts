import { censusPackageContract } from './census-package-contract';
import type { CensusPackage } from './census-package-contract';
import type { StubArgument } from '@dungeonmaster/shared/@types';

export const CensusPackageStub = ({ ...props }: StubArgument<CensusPackage> = {}): CensusPackage =>
  censusPackageContract.parse({
    name: '@acme/example',
    dir: 'packages/example',
    ...props,
  });
