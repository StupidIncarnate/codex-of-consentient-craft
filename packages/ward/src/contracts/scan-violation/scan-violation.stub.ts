import type { StubArgument } from '@dungeonmaster/shared/@types';

import { scanViolationContract } from './scan-violation-contract';
import type { ScanViolation } from './scan-violation-contract';

export const ScanViolationStub = ({ ...props }: StubArgument<ScanViolation> = {}): ScanViolation =>
  scanViolationContract.parse({
    file: 'packages/ward/src/example.ts',
    line: 1,
    message: 'Example violation',
    ...props,
  });
