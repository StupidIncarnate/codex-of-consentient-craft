import type { StubArgument } from '@dungeonmaster/shared/@types';

import { chatPatchPayloadContract } from './chat-patch-payload-contract';
import type { ChatPatchPayload } from './chat-patch-payload-contract';

export const ChatPatchPayloadStub = ({
  ...props
}: StubArgument<ChatPatchPayload> = {}): ChatPatchPayload =>
  chatPatchPayloadContract.parse({
    toolUseId: 'tool-1',
    agentId: 'agent-1',
    ...props,
  });
