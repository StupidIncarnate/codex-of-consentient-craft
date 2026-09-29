import type { StubArgument } from '@dungeonmaster/shared/@types';

import { scanFolderTargetsContract } from './scan-folder-targets-contract';
import type { ScanFolderTargets } from './scan-folder-targets-contract';

export const ScanFolderTargetsStub = ({
  ...props
}: StubArgument<ScanFolderTargets> = {}): ScanFolderTargets =>
  scanFolderTargetsContract.parse({
    inScope: true,
    targets: [],
    ...props,
  });
