import { messageContract } from './message-contract';
import type { Message } from './message-contract';

export const MessageStub = ({ value }: { value: string } = { value: 'Test message' }): Message =>
  messageContract.parse(value);
