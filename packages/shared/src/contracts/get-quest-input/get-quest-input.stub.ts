import type { StubArgument } from '../../@types/stub-argument.type';

import { getQuestInputContract } from './get-quest-input-contract';
import type { GetQuestInput } from './get-quest-input-contract';

export const GetQuestInputStub = ({
  ...props
}: StubArgument<GetQuestInput> = {}): GetQuestInput => {
  const { stage, flowId, packageName, ...dataProps } = props;

  return getQuestInputContract.parse({
    questId: 'test-quest',
    ...dataProps,
    ...(stage !== undefined && { stage }),
    ...(flowId !== undefined && { flowId }),
    ...(packageName !== undefined && { packageName }),
  });
};
