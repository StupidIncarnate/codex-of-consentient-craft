import { errorMessageContract } from './error-message-contract';
import type { ErrorMessage } from './error-message-contract';

export const ErrorMessageStub = (
  {
    value,
  }: {
    value: string;
  } = {
    value: 'An error occurred',
  },
): ErrorMessage => errorMessageContract.parse(value);
