import type { StubArgument } from '@dungeonmaster/shared/@types';
import { responderResultContract } from './responder-result-contract';
import type { ResponderResult } from './responder-result-contract';

export const ResponderResultStub = ({
  ...props
}: StubArgument<ResponderResult> = {}): ResponderResult =>
  responderResultContract.parse({
    status: 200,
    data: { success: true },
    ...props,
  });
