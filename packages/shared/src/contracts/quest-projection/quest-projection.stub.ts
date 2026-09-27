import type { StubArgument } from '../../@types/stub-argument.type';

import { QuestIdStub } from '../quest-id/quest-id.stub';
import { questProjectionContract } from './quest-projection-contract';
import type { QuestProjection } from './quest-projection-contract';

export const QuestProjectionStub = ({
  ...props
}: StubArgument<QuestProjection> = {}): QuestProjection =>
  questProjectionContract.parse({
    questId: QuestIdStub(),
    scopes: [],
    totalPlannedSteps: 0,
    completedSteps: 0,
    ...props,
  });
