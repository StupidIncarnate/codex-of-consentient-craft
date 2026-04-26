import type { StubArgument } from '@dungeonmaster/shared/@types';
import { questIdParamsContract } from './quest-id-params-contract';
import type { QuestIdParams } from './quest-id-params-contract';

export const QuestIdParamsStub = ({ ...props }: StubArgument<QuestIdParams> = {}): QuestIdParams =>
  questIdParamsContract.parse({
    questId: 'test-quest',
    ...props,
  });
