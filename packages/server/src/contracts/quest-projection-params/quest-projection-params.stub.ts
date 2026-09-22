import type { StubArgument } from '@dungeonmaster/shared/@types';

import { questProjectionParamsContract } from './quest-projection-params-contract';
import type { QuestProjectionParams } from './quest-projection-params-contract';

export const QuestProjectionParamsStub = ({
  ...props
}: StubArgument<QuestProjectionParams> = {}): QuestProjectionParams =>
  questProjectionParamsContract.parse({
    questId: '11111111-1111-4111-8111-111111111111',
    ...props,
  });
