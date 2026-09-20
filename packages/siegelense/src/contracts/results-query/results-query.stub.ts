import type { StubArgument } from '@dungeonmaster/shared/@types';

import { InstanceIdStub } from '../instance-id/instance-id.stub';
import { resultsQueryContract } from './results-query-contract';
import type { ResultsQuery } from './results-query-contract';

export const ResultsQueryStub = ({ ...props }: StubArgument<ResultsQuery> = {}): ResultsQuery =>
  resultsQueryContract.parse({
    instanceId: InstanceIdStub(),
    runId: null,
    step: null,
    kind: null,
    where: null,
    fields: null,
    since: null,
    ...props,
  });
