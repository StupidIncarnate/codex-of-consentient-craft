import type { StubArgument } from '@dungeonmaster/shared/@types';
import { messageBodyContract } from './message-body-contract';
import type { MessageBody } from './message-body-contract';

export const MessageBodyStub = ({ ...props }: StubArgument<MessageBody> = {}): MessageBody =>
  messageBodyContract.parse({ message: 'hello world', ...props });
