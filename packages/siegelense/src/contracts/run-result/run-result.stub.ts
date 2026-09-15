import type { StubArgument } from '@dungeonmaster/shared/@types';

import { InstanceIdStub } from '../instance-id/instance-id.stub';
import { RunIdStub } from '../run-id/run-id.stub';
import { RunIndexStub } from '../run-index/run-index.stub';
import { RunStatusStub } from '../run-status/run-status.stub';
import { ShotListingStub } from '../shot-listing/shot-listing.stub';
import { StepIndexStub } from '../step-index/step-index.stub';
import { runResultContract } from './run-result-contract';
import type { RunResult } from './run-result-contract';

export const RunResultStub = ({ ...props }: StubArgument<RunResult> = {}): RunResult =>
  runResultContract.parse({
    instanceId: InstanceIdStub(),
    runId: RunIdStub(),
    status: RunStatusStub(),
    stepsRun: StepIndexStub({ value: 5 }),
    stoppedAt: null,
    index: RunIndexStub(),
    shots: [ShotListingStub()],
    ...props,
  });
