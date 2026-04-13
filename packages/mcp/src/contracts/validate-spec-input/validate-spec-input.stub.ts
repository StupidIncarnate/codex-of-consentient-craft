import type { StubArgument } from '@dungeonmaster/shared/@types';

import { validateSpecInputContract } from './validate-spec-input-contract';
import type { ValidateSpecInput } from './validate-spec-input-contract';

export const ValidateSpecInputStub = ({
  ...props
}: StubArgument<ValidateSpecInput> = {}): ValidateSpecInput =>
  validateSpecInputContract.parse({
    questId: 'add-auth',
    ...props,
  });
