import type { StubArgument } from '../../@types/stub-argument.type';

import { sessionContract } from './session-contract';
import type { Session } from './session-contract';

export const SessionStub = ({ ...props }: StubArgument<Session> = {}): Session =>
  sessionContract.parse({
    id: '9c4d8f1c-3e38-48c9-bdec-22b61883b473',
    ...props,
  });
