import type { StubArgument } from '@dungeonmaster/shared/@types';

import { getQuestInputContract } from './get-quest-input-contract';
import type { GetQuestInput } from './get-quest-input-contract';

export const GetQuestInputStub = ({
  ...props
}: StubArgument<GetQuestInput> = {}): GetQuestInput => {
  const { sections, ...dataProps } = props;

  return getQuestInputContract.parse({
    questId: 'test-quest',
    ...dataProps,
    ...(sections !== undefined && { sections }),
  });
};
