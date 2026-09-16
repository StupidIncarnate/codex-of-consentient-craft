import type { StubArgument } from '@dungeonmaster/shared/@types';

import { InstanceIdStub } from '../instance-id/instance-id.stub';
import { resultsArgsContract } from './results-args-contract';
import type { ResultsArgs } from './results-args-contract';

export const ResultsArgsStub = ({ ...props }: StubArgument<ResultsArgs> = {}): ResultsArgs =>
  resultsArgsContract.parse({
    instanceId: InstanceIdStub(),
    runId: null,
    step: null,
    kind: null,
    where: null,
    fields: null,
    since: null,
    ...props,
  });
