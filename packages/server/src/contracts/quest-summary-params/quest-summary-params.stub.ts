import type { StubArgument } from '@dungeonmaster/shared/@types';

import { questSummaryParamsContract } from './quest-summary-params-contract';
import type { QuestSummaryParams } from './quest-summary-params-contract';

export const QuestSummaryParamsStub = ({
  ...props
}: StubArgument<QuestSummaryParams> = {}): QuestSummaryParams =>
  questSummaryParamsContract.parse({
    questId: '11111111-1111-4111-8111-111111111111',
    ...props,
  });
