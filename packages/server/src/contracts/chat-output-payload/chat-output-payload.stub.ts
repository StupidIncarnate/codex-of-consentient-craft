import type { StubArgument } from '@dungeonmaster/shared/@types';
import { chatOutputRoutingContract } from './chat-output-payload-contract';
import type { ChatOutputRouting } from './chat-output-payload-contract';

export const ChatOutputRoutingStub = ({
  ...props
}: StubArgument<ChatOutputRouting> = {}): ChatOutputRouting =>
  chatOutputRoutingContract.parse({ ...props });
