import type { StubArgument } from '@dungeonmaster/shared/@types';

import { getNextStepInputContract } from './get-next-step-input-contract';
import type { GetNextStepInput } from './get-next-step-input-contract';

export const GetNextStepInputStub = ({
  ...props
}: StubArgument<GetNextStepInput> = {}): GetNextStepInput =>
  getNextStepInputContract.parse({ ...props });
