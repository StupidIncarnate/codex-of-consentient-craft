import type { StubArgument } from '@dungeonmaster/shared/@types';

import { questRiftcarverDetailParamsContract } from './quest-riftcarver-detail-params-contract';
import type { QuestRiftcarverDetailParams } from './quest-riftcarver-detail-params-contract';

export const QuestRiftcarverDetailParamsStub = ({
  ...props
}: StubArgument<QuestRiftcarverDetailParams> = {}): QuestRiftcarverDetailParams =>
  questRiftcarverDetailParamsContract.parse({
    questId: '11111111-1111-4111-8111-111111111111',
    riftcarverResultId: '22222222-2222-4222-8222-222222222222',
    ...props,
  });
