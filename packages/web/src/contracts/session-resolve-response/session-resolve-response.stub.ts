import type { StubArgument } from '@dungeonmaster/shared/@types';

import { sessionResolveResponseContract } from './session-resolve-response-contract';
import type { SessionResolveResponse } from './session-resolve-response-contract';

export const SessionResolveResponseStub = ({
  ...props
}: StubArgument<SessionResolveResponse> = {}): SessionResolveResponse =>
  sessionResolveResponseContract.parse({
    questId: 'add-auth',
    ...props,
  });
