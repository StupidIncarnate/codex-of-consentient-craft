import type { StubArgument } from '@dungeonmaster/shared/@types';

import { stepFileReferenceContract } from './step-file-reference-contract';
import type { StepFileReference } from './step-file-reference-contract';

export const StepFileReferenceStub = ({
  ...props
}: StubArgument<StepFileReference> = {}): StepFileReference =>
  stepFileReferenceContract.parse({
    path: 'src/brokers/user/create/user-create-broker.ts',
    ...props,
  });
