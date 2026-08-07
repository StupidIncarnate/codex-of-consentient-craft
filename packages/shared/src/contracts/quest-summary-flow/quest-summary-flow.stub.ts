import type { StubArgument } from '@dungeonmaster/shared/@types';

import { QuestSummaryTrackCountsStub } from '../quest-summary-track-counts/quest-summary-track-counts.stub';
import { questSummaryFlowContract } from './quest-summary-flow-contract';
import type { QuestSummaryFlow } from './quest-summary-flow-contract';

export const QuestSummaryFlowStub = ({
  ...props
}: StubArgument<QuestSummaryFlow> = {}): QuestSummaryFlow =>
  questSummaryFlowContract.parse({
    id: 'login-flow',
    name: 'Login Flow',
    flowType: 'runtime',
    tracks: [
      QuestSummaryTrackCountsStub({ id: 'flowrider' }),
      QuestSummaryTrackCountsStub({ id: 'siegemaster' }),
    ],
    ...props,
  });
