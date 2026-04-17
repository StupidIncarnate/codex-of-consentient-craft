import type { StubArgument } from '@dungeonmaster/shared/@types';

import { chatLineOutputContract } from './chat-line-output-contract';
import type { ChatLineOutput } from './chat-line-output-contract';

export const ChatLineEntriesStub = ({
  ...props
}: StubArgument<ChatLineOutput> = {}): ChatLineOutput =>
  chatLineOutputContract.parse({
    type: 'entries',
    entries: [{ role: 'assistant', type: 'text', content: 'hello' }],
    ...props,
  });

export const ChatLinePatchStub = ({
  ...props
}: StubArgument<ChatLineOutput> = {}): ChatLineOutput =>
  chatLineOutputContract.parse({
    type: 'patch',
    toolUseId: 'toolu_01EaCJyt5y8gzMNyGYarwUDZ',
    agentId: 'agent-abc',
    ...props,
  });
