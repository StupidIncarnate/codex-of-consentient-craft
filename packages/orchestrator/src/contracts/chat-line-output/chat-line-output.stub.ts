import type { StubArgument } from '@dungeonmaster/shared/@types';

import { chatLineOutputContract } from './chat-line-output-contract';
import type { ChatLineOutput } from './chat-line-output-contract';

export const ChatLineEntryStub = ({
  ...props
}: StubArgument<ChatLineOutput> = {}): ChatLineOutput =>
  chatLineOutputContract.parse({
    type: 'entry',
    entry: { type: 'assistant', message: { content: [] } },
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
