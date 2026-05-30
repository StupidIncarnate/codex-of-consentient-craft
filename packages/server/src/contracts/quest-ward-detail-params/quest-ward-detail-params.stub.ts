import type { StubArgument } from '@dungeonmaster/shared/@types';

import { questWardDetailParamsContract } from './quest-ward-detail-params-contract';
import type { QuestWardDetailParams } from './quest-ward-detail-params-contract';

export const QuestWardDetailParamsStub = ({
  ...props
}: StubArgument<QuestWardDetailParams> = {}): QuestWardDetailParams =>
  questWardDetailParamsContract.parse({
    questId: '11111111-1111-4111-8111-111111111111',
    wardResultId: '22222222-2222-4222-8222-222222222222',
    ...props,
  });
