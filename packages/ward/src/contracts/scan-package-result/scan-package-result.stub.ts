import type { StubArgument } from '@dungeonmaster/shared/@types';

import { scanPackageResultContract } from './scan-package-result-contract';
import type { ScanPackageResult } from './scan-package-result-contract';

export const ScanPackageResultStub = ({
  ...props
}: StubArgument<ScanPackageResult> = {}): ScanPackageResult =>
  scanPackageResultContract.parse({
    name: '@dungeonmaster/example',
    violations: 0,
    batches: [],
    ...props,
  });
