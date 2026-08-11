import type { StubArgument } from '@dungeonmaster/shared/@types';

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
