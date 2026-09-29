import type { StubArgument } from '@dungeonmaster/shared/@types';

import { contractIndexPackageContract } from './contract-index-package-contract';
import type { ContractIndexPackage } from './contract-index-package-contract';

export const ContractIndexPackageStub = ({
  ...props
}: StubArgument<ContractIndexPackage> = {}): ContractIndexPackage =>
  contractIndexPackageContract.parse({
    name: '@repo/example',
    dir: '/repo/packages/example',
    ...props,
  });
