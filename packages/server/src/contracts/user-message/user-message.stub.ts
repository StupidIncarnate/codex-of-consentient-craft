import { userMessageContract, type UserMessage } from './user-message-contract';

export const UserMessageStub = (
  { value }: { value: string } = { value: 'stub user message' },
): UserMessage => userMessageContract.parse(value);
