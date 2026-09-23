import type { StubArgument } from '@dungeonmaster/shared/@types';

import { questSummaryDebtContract } from './quest-summary-debt-contract';
import type { QuestSummaryDebt } from './quest-summary-debt-contract';

export const QuestSummaryDebtStub = ({
  ...props
}: StubArgument<QuestSummaryDebt> = {}): QuestSummaryDebt =>
  questSummaryDebtContract.parse({
    id: 'login-flow:observable:rejects-bleh-payload:flowrider',
    unitId: 'login-flow:observable:rejects-bleh-payload',
    flowId: 'login-flow',
    kind: 'observable',
    track: 'flowrider',
    mark: 'unmet',
    evidence: 'the badge still renders the stale count after the queue drains; no test reaches it',
    workItemId: 'f47ac10b-58cc-4372-a567-0e02b2c3d479',
    at: '2026-01-01T00:00:00.000Z',
    ...props,
  });
