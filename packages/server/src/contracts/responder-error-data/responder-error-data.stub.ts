import type { StubArgument } from '@dungeonmaster/shared/@types';
import { responderErrorDataContract } from './responder-error-data-contract';
import type { ResponderErrorData } from './responder-error-data-contract';

export const ResponderErrorDataStub = ({
  ...props
}: StubArgument<ResponderErrorData> = {}): ResponderErrorData =>
  responderErrorDataContract.parse({
    error: 'Invalid params',
    ...props,
  });
