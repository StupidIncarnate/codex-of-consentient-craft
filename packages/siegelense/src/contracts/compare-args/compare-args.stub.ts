import type { StubArgument } from '@dungeonmaster/shared/@types';

import { InstanceIdStub } from '../instance-id/instance-id.stub';
import { RunIdStub } from '../run-id/run-id.stub';
import { compareArgsContract } from './compare-args-contract';
import type { CompareArgs } from './compare-args-contract';

export const CompareArgsStub = ({ ...props }: StubArgument<CompareArgs> = {}): CompareArgs =>
  compareArgsContract.parse({
    instanceId: InstanceIdStub(),
    runA: RunIdStub({ value: 'run_4' }),
    runB: RunIdStub({ value: 'run_5' }),
    ...props,
  });
