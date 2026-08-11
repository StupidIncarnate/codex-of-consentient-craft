import type { StubArgument } from '@dungeonmaster/shared/@types';

import { reactFlowPackageChipContract } from './react-flow-package-chip-contract';
import type { ReactFlowPackageChip } from './react-flow-package-chip-contract';

export const ReactFlowPackageChipStub = ({
  ...props
}: StubArgument<ReactFlowPackageChip> = {}): ReactFlowPackageChip =>
  reactFlowPackageChipContract.parse({
    name: 'auth-service',
    packageType: 'library',
    ...props,
  });
