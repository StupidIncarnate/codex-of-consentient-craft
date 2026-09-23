import type { StubArgument } from '@dungeonmaster/shared/@types';

import { questSummaryTrackCountsContract } from './quest-summary-track-counts-contract';
import type { QuestSummaryTrackCounts } from './quest-summary-track-counts-contract';

export const QuestSummaryTrackCountsStub = ({
  ...props
}: StubArgument<QuestSummaryTrackCounts> = {}): QuestSummaryTrackCounts =>
  questSummaryTrackCountsContract.parse({
    id: 'flowrider',
    met: 12,
    cantMeet: 1,
    unmet: 2,
    outstanding: 3,
    ...props,
  });
