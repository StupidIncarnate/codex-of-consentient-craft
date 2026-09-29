import type { StubArgument } from '@dungeonmaster/shared/@types';

import { scanConfigContract } from './scan-config-contract';
import type { ScanConfig } from './scan-config-contract';

export const ScanConfigStub = ({ ...props }: StubArgument<ScanConfig> = {}): ScanConfig =>
  scanConfigContract.parse({
    rule: '@dungeonmaster/ban-workspace-export-mocks',
    paths: [],
    ...props,
  });
