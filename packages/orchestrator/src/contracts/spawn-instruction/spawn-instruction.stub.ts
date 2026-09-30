import type { StubArgument } from '@dungeonmaster/shared/@types';
import { QuestIdStub } from '@dungeonmaster/shared/contracts/quest-id/quest-id.stub';
import { QuestWorkItemIdStub } from '@dungeonmaster/shared/contracts/quest-work-item-id/quest-work-item-id.stub';

import { spawnInstructionContract } from './spawn-instruction-contract';
import type { SpawnInstruction } from './spawn-instruction-contract';

export const SpawnInstructionStub = ({
  ...props
}: StubArgument<SpawnInstruction> = {}): SpawnInstruction =>
  spawnInstructionContract.parse({
    questId: QuestIdStub({ value: 'aaaaaaaa-1111-4222-9333-444444444444' }),
    role: 'codeweaver',
    workItemId: QuestWorkItemIdStub({ value: 'bbbbbbbb-1111-4222-9333-444444444444' }),
    taskPrompt: 'Call mcp__dungeonmaster__get-agent-prompt(...)',
    ...props,
  });
