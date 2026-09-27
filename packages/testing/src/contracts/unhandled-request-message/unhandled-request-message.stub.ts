import { unhandledRequestMessageContract } from './unhandled-request-message-contract';
import type { UnhandledRequestMessage } from './unhandled-request-message-contract';

export const UnhandledRequestMessageStub = (
  { value }: { value: string } = { value: 'GET http://localhost/api/unstaged' },
): UnhandledRequestMessage => unhandledRequestMessageContract.parse(value);
