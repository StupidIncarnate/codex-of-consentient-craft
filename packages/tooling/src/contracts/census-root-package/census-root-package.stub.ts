import { censusRootPackageContract } from './census-root-package-contract';
import type { CensusRootPackage } from './census-root-package-contract';
import type { StubArgument } from '@dungeonmaster/shared/@types';

export const CensusRootPackageStub = ({
  ...props
}: StubArgument<CensusRootPackage> = {}): CensusRootPackage =>
  censusRootPackageContract.parse({
    name: '@acme/app',
    ...props,
  });
