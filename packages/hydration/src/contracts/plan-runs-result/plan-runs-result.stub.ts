import type { StubArgument } from '@dungeonmaster/shared/@types';
import { planRunsResultContract } from './plan-runs-result-contract';
import type { PlanRunsResult } from './plan-runs-result-contract';

// Defaults to the serverless variant. Pass a full override — e.g.
// PlanRunsResultStub({ serverless: false, needsServerFor: 'guild' }) — to get the other one; the
// discriminated union parse strips the now-irrelevant default fields.
export const PlanRunsResultStub = ({
  ...props
}: StubArgument<PlanRunsResult> = {}): PlanRunsResult =>
  planRunsResultContract.parse({
    serverless: true,
    ...props,
  });
