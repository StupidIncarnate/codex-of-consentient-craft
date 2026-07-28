import type { StubArgument } from '@dungeonmaster/shared/@types';

import { agentQuestPayloadContract } from './agent-quest-payload-contract';
import type { AgentQuestPayload } from './agent-quest-payload-contract';

export const AgentQuestPayloadStub = ({
  ...props
}: StubArgument<AgentQuestPayload> = {}): AgentQuestPayload =>
  agentQuestPayloadContract.parse({
    success: true,
    ...props,
  });
