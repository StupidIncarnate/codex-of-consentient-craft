import type { StubArgument } from '@dungeonmaster/shared/@types';

import { questSummaryTrackCountsContract } from './quest-summary-track-counts-contract';
import type { QuestSummaryTrackCounts } from './quest-summary-track-counts-contract';

export const QuestSummaryTrackCountsStub = ({
  ...props
}: StubArgument<QuestSummaryTrackCounts> = {}): QuestSummaryTrackCounts =>
  questSummaryTrackCountsContract.parse({
    id: 'flowrider',
    confirmed: 12,
    unconfirmable: 1,
    outstanding: 3,
    ...props,
  });
