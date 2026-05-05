import type { StubArgument } from '@dungeonmaster/shared/@types';

import { chatLineOutputContract } from './chat-line-output-contract';
import type { ChatLineOutput } from './chat-line-output-contract';

export const ChatLineEntriesStub = ({
  ...props
}: StubArgument<ChatLineOutput> = {}): ChatLineOutput =>
  chatLineOutputContract.parse({
    type: 'entries',
    entries: [
      {
        role: 'assistant',
        type: 'text',
        content: 'hello',
        uuid: 'chat-line-entries-stub-uuid',
        timestamp: '2025-01-01T00:00:00.000Z',
      },
    ],
    ...props,
  });

export const ChatLineAgentDetectedStub = ({
  ...props
}: StubArgument<ChatLineOutput> = {}): ChatLineOutput =>
  chatLineOutputContract.parse({
    type: 'agent-detected',
    toolUseId: 'toolu_01EaCJyt5y8gzMNyGYarwUDZ',
    agentId: 'agent-abc',
    ...props,
  });
