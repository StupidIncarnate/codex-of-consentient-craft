import type { StubArgument } from '@dungeonmaster/shared/@types';
import { chatOutputRoutingContract } from './chat-output-routing-contract';
import type { ChatOutputRouting } from './chat-output-routing-contract';

export const ChatOutputRoutingStub = ({
  ...props
}: StubArgument<ChatOutputRouting> = {}): ChatOutputRouting =>
  chatOutputRoutingContract.parse({ ...props });
