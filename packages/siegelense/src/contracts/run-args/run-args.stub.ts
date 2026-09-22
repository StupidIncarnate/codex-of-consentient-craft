import type { StubArgument } from '@dungeonmaster/shared/@types';

import { InstanceIdStub } from '../instance-id/instance-id.stub';
import { StepStub } from '../step/step.stub';
import { StopOnStub } from '../stop-on/stop-on.stub';
import { runArgsContract } from './run-args-contract';
import type { RunArgs } from './run-args-contract';

export const RunArgsStub = ({ ...props }: StubArgument<RunArgs> = {}): RunArgs =>
  runArgsContract.parse({
    instanceId: InstanceIdStub(),
    steps: [StepStub()],
    stopOn: StopOnStub(),
    isJson: false,
    ...props,
  });
