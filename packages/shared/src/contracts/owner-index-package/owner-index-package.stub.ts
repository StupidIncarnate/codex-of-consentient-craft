import type { StubArgument } from '@dungeonmaster/shared/@types';

import { ownerIndexPackageContract } from './owner-index-package-contract';
import type { OwnerIndexPackage } from './owner-index-package-contract';

export const OwnerIndexPackageStub = ({
  ...props
}: StubArgument<OwnerIndexPackage> = {}): OwnerIndexPackage =>
  ownerIndexPackageContract.parse({
    name: '@repo/example',
    dir: '/repo/packages/example',
    dependencies: [],
    ...props,
  });
