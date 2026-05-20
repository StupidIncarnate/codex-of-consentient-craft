import type { StubArgument } from '@dungeonmaster/shared/@types';
import { sessionIdParamsContract } from './session-id-params-contract';
import type { SessionIdParams } from './session-id-params-contract';

export const SessionIdParamsStub = ({
  ...props
}: StubArgument<SessionIdParams> = {}): SessionIdParams =>
  sessionIdParamsContract.parse({
    sessionId: '9c4d8f1c-3e38-48c9-bdec-22b61883b473',
    ...props,
  });
