import type { StubArgument } from '@dungeonmaster/shared/@types';

import { statusAnswerContract } from './status-answer-contract';
import type { StatusAnswer } from './status-answer-contract';

export const StatusAnswerStub = ({ ...props }: StubArgument<StatusAnswer> = {}): StatusAnswer =>
  statusAnswerContract.parse({
    monitored: [
      'rss per process group',
      'free memory',
      'free disk',
      'load average',
      'kernel OOM events',
    ],
    machine: {
      freeMemMB: 980,
      totalMemMB: 16_000,
      freeDiskMB: 2100,
      cores: 8,
      loadAvg: [7.9, 6.2, 4.1],
      oomKillsSinceBoot: 2,
      lastOomAt: '20:11:04',
    },
    instances: [],
    ...props,
  });
