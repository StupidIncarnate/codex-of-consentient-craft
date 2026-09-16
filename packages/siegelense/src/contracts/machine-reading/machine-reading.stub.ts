import type { StubArgument } from '@dungeonmaster/shared/@types';

import { machineReadingContract } from './machine-reading-contract';
import type { MachineReading } from './machine-reading-contract';

export const MachineReadingStub = ({
  ...props
}: StubArgument<MachineReading> = {}): MachineReading =>
  machineReadingContract.parse({
    freeMemMB: 980,
    totalMemMB: 16_000,
    freeDiskMB: 2100,
    cores: 8,
    loadAvg: [7.9, 6.2, 4.1],
    oomKillsSinceBoot: 2,
    lastOomAt: '20:11:04',
    ...props,
  });
