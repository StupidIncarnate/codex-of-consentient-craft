import type { StubArgument } from '@dungeonmaster/shared/@types';

import { snapshotsAnswerContract } from './snapshots-answer-contract';
import type { SnapshotsAnswer } from './snapshots-answer-contract';

export const SnapshotsAnswerStub = ({
  ...props
}: StubArgument<SnapshotsAnswer> = {}): SnapshotsAnswer =>
  snapshotsAnswerContract.parse({
    instanceId: 'inst_7f3a9c21',
    instanceState: 'alive',
    snapshots: [],
    ...props,
  });
