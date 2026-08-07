import type { StubArgument } from '@dungeonmaster/shared/@types';

import { questSummaryObservableContract } from './quest-summary-observable-contract';
import type { QuestSummaryObservable } from './quest-summary-observable-contract';

export const QuestSummaryObservableStub = ({
  ...props
}: StubArgument<QuestSummaryObservable> = {}): QuestSummaryObservable =>
  questSummaryObservableContract.parse({
    id: 'login-flow:observable:rejects-bleh-payload',
    flowId: 'login-flow',
    nodeId: 'submit-credentials',
    observableId: 'rejects-bleh-payload',
    addedBy: 'siegemaster',
    observableType: 'api-call',
    description: 'POST /api/auth/login returns 400 for a non-JSON body',
    ...props,
  });
