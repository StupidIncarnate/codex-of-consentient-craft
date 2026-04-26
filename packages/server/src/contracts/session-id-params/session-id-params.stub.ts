import type { StubArgument } from '@dungeonmaster/shared/@types';
import { sessionIdParamsContract } from './session-id-params-contract';
import type { SessionIdParams } from './session-id-params-contract';

export const SessionIdParamsStub = ({
  ...props
}: StubArgument<SessionIdParams> = {}): SessionIdParams =>
  sessionIdParamsContract.parse({
    sessionId: 'test-session',
    ...props,
  });
