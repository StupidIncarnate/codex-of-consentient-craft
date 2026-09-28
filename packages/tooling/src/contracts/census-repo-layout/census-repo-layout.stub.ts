import { censusRepoLayoutContract } from './census-repo-layout-contract';
import type { CensusRepoLayout } from './census-repo-layout-contract';
import type { StubArgument } from '@dungeonmaster/shared/@types';
import { CensusPackageStub } from '../census-package/census-package.stub';

export const CensusRepoLayoutStub = ({
  ...props
}: StubArgument<CensusRepoLayout> = {}): CensusRepoLayout =>
  censusRepoLayoutContract.parse({
    scope: '@acme',
    packages: [CensusPackageStub()],
    ...props,
  });
