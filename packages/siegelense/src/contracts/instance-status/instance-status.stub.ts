import type { StubArgument } from '@dungeonmaster/shared/@types';

import { instanceStatusContract } from './instance-status-contract';
import type { InstanceStatus } from './instance-status-contract';

export const InstanceStatusStub = ({
  ...props
}: StubArgument<InstanceStatus> = {}): InstanceStatus =>
  instanceStatusContract.parse({
    id: 'inst_7f3a',
    state: 'alive',
    specName: 'dungeonmaster-web',
    uptime: '14m',
    lastBeat: '2s ago',
    runs: 3,
    rssMB: 1840,
    rssAtLastBeat: null,
    lastStep: null,
    orphans: [],
    evidence: null,
    likelyCause: null,
    evidenceComplete: true,
    ...props,
  });
