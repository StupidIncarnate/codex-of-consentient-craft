import type { StubArgument } from '@dungeonmaster/shared/@types';

import { scanReportContract } from './scan-report-contract';
import type { ScanReport } from './scan-report-contract';

export const ScanReportStub = ({ ...props }: StubArgument<ScanReport> = {}): ScanReport =>
  scanReportContract.parse({
    rule: '@dungeonmaster/ban-workspace-export-mocks',
    packages: [],
    ...props,
  });
