import type { StubArgument } from '@dungeonmaster/shared/@types';

import { InstanceIdStub } from '../instance-id/instance-id.stub';
import { StepStub } from '../step/step.stub';
import { StopOnStub } from '../stop-on/stop-on.stub';
import { runRequestContract } from './run-request-contract';
import type { RunRequest } from './run-request-contract';

export const RunRequestStub = ({ ...props }: StubArgument<RunRequest> = {}): RunRequest =>
  runRequestContract.parse({
    instanceId: InstanceIdStub(),
    steps: [StepStub()],
    stopOn: StopOnStub(),
    ...props,
  });
