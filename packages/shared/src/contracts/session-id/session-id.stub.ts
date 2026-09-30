import type { Session } from '../session/session-contract';
import { sessionContract } from '../session/session-contract';

export const SessionIdStub = (
  { value }: { value: string } = { value: '9c4d8f1c-3e38-48c9-bdec-22b61883b473' },
): Session['id'] => sessionContract.shape.id.parse(value);
