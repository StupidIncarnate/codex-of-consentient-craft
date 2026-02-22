import { errorMessageContract } from './error-message-contract';
import type { ErrorMessage } from './error-message-contract';

export const ErrorMessageStub = (
  {
    value,
  }: {
    value: string;
  } = {
    value: 'Unknown error',
  },
): ErrorMessage => errorMessageContract.parse(value);
