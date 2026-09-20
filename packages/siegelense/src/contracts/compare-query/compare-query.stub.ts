import type { StubArgument } from '@dungeonmaster/shared/@types';

import { InstanceIdStub } from '../instance-id/instance-id.stub';
import { RunIdStub } from '../run-id/run-id.stub';
import { compareQueryContract } from './compare-query-contract';
import type { CompareQuery } from './compare-query-contract';

export const CompareQueryStub = ({ ...props }: StubArgument<CompareQuery> = {}): CompareQuery =>
  compareQueryContract.parse({
    instanceId: InstanceIdStub(),
    runA: RunIdStub({ value: 'run_4' }),
    runB: RunIdStub({ value: 'run_5' }),
    ...props,
  });
