import type { StubArgument } from '../../@types/stub-argument.type';

import { packageGraphEntryContract } from './package-graph-entry-contract';
import type { PackageGraphEntry } from './package-graph-entry-contract';

export const PackageGraphEntryStub = ({
  ...props
}: StubArgument<PackageGraphEntry> = {}): PackageGraphEntry =>
  packageGraphEntryContract.parse({
    id: 'auth-service',
    dependsOn: [],
    depth: 0,
    packageType: 'library',
    changeType: 'edit',
    ...props,
  });
