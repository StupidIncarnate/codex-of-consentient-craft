import { sessionIdContract } from './session-id-contract';
import type { SessionId } from './session-id-contract';

export const SessionIdStub = (
  { value }: { value: string } = { value: '9c4d8f1c-3e38-48c9-bdec-22b61883b473' },
): SessionId => sessionIdContract.parse(value);
