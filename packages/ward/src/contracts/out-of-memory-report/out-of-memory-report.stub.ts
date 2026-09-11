import { outOfMemoryReportContract } from './out-of-memory-report-contract';
import type { OutOfMemoryReport } from './out-of-memory-report-contract';

export const OutOfMemoryReportStub = (
  { value }: { value: string } = {
    value:
      '  ward  exit 134  V8 heap limit — the check printed "JavaScript heap out of memory" and aborted',
  },
): OutOfMemoryReport => outOfMemoryReportContract.parse(value);
