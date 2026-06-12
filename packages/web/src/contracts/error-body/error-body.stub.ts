import type { StubArgument } from '@dungeonmaster/shared/@types';

import { errorBodyContract } from './error-body-contract';
import type { ErrorBody } from './error-body-contract';

export const ErrorBodyStub = ({ ...props }: StubArgument<ErrorBody> = {}): ErrorBody =>
  errorBodyContract.parse({
    error: 'Something went wrong',
    ...props,
  });
